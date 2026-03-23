import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as IntentLauncher from "expo-intent-launcher";
import * as Application from "expo-application";

import BloodPressureChart from "../../../features/health/components/BloodPressureChart";
import BloodGlucoseChart from "../../../features/health/components/BloodGlucoseChart";
import DateRangePicker from "../../../shared/components/DateRangePicker";
import { Button } from "../../../shared/components/Button";
import { router } from "expo-router";
import { color, gradient } from "../../../shared/constants/colors";

import StepsChart, {
  type StepsPoint,
} from "../../../features/health/components/StepsChart";
import HeartRateChart, {
  type HeartRatePoint,
} from "../../../features/health/components/HeartRateChart";

import {
  ensureHealthConnectInitialized,
  readHeartRateSamples,
  readStepsSamples,
  requestStepsAndHeartRatePermissions,
  resetHealthConnectInitialization,
} from "../../../features/health/healthConnect";

import {
  getBloodPressureReport,
  type BpMeasurement,
} from "../../../features/health/api/get-blood-pressures";

import {
  getBloodGlucoseReport,
  type GlucoseMeasurement,
} from "../../../features/health/api/get-blood-glucose";

import { getClerkUserId } from "../../../features/auth/auth.utils";

const toYMDLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// Health Connect is only available on Android
const isAndroid = Platform.OS === "android";

export default function BloodPressureIndexScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [measurements, setMeasurements] = useState<BpMeasurement[]>([]);
  const [glucoseMeasurements, setGlucoseMeasurements] = useState<
    GlucoseMeasurement[]
  >([]);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [activeSection, setActiveSection] = useState<"readings" | "watch">(
    "readings",
  );

  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepsPoints, setStepsPoints] = useState<StepsPoint[]>([]);

  const [heartRateLoading, setHeartRateLoading] = useState(false);
  const [heartRatePoints, setHeartRatePoints] = useState<HeartRatePoint[]>([]);

  const [healthConnectAvailable, setHealthConnectAvailable] = useState<
    boolean | null
  >(null);
  const [healthConnectError, setHealthConnectError] = useState<string | null>(
    null,
  );

  const fetchMeasurements = useCallback(async () => {
    try {
      setMeasurements([]);

      const accountIdFromClerk = await getClerkUserId();
      if (!accountIdFromClerk) {
        throw new Error("User ID from Clerk Auth API not found");
      }

      const { measurements: cleaned } = await getBloodPressureReport({
        accountId: accountIdFromClerk,
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
      });

      setMeasurements(cleaned);
    } catch (err: any) {
      console.log("Failed to fetch BP measurements", {
        message: err?.message,
        status: err?.response?.status,
        url: err?.config?.url,
        params: err?.config?.params,
        data: err?.response?.data,
      });
      Alert.alert("Could not load blood pressure history", "Please try again.");
    }
  }, [startDate, endDate]);

  const fetchGlucoseMeasurements = useCallback(async () => {
    try {
      setGlucoseMeasurements([]);

      const accountIdFromClerk = await getClerkUserId();
      if (!accountIdFromClerk) {
        throw new Error("User ID from Clerk Auth API not found");
      }

      const { measurements: cleaned } = await getBloodGlucoseReport({
        accountId: accountIdFromClerk,
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
      });

      setGlucoseMeasurements(cleaned);
    } catch (err: any) {
      console.log("Failed to fetch glucose measurements", {
        message: err?.message,
        status: err?.response?.status,
        url: err?.config?.url,
        params: err?.config?.params,
        data: err?.response?.data,
      });
      Alert.alert("Could not load blood glucose history", "Please try again.");
    }
  }, [startDate, endDate]);

  const ensureHealthConnectReady = useCallback(async () => {
    if (!isAndroid) {
      setHealthConnectAvailable(false);
      setHealthConnectError("Health Connect is only available on Android");
      return;
    }

    try {
      const result = await ensureHealthConnectInitialized();
      setHealthConnectAvailable(result.available);
      setHealthConnectError(result.error ?? null);

      if (!result.initialized) {
        throw new Error(
          result.error ??
            "Health Connect could not be initialized. Ensure Health Connect is installed and set up.",
        );
      }
    } catch (err: any) {
      setHealthConnectAvailable(false);
      setHealthConnectError(err?.message ?? "Unknown error");
      throw err;
    }
  }, []);

  const openHealthConnect = async () => {
    // Resolve the *actual* runtime package name/applicationId.
    // This frequently differs between dev-client/debug/release builds.
    const runtimePackage =
      Application.applicationId || Application.applicationName || "unknown";

    console.log("[HealthConnectUI] runtime package", {
      applicationId: Application.applicationId,
      applicationName: Application.applicationName,
    });

    // Health Connect package: com.google.android.apps.healthdata
    // Try to open the permission/settings screen via Android Intent (most reliable),
    // then fall back to deep links, and finally Play Store.

    const marketUrl = "market://details?id=com.google.android.apps.healthdata";
    const webUrl =
      "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata";

    // Deep-link schemes are not supported on many devices.
    const hcPermissionUrl = `healthconnect://permissions?packageName=${encodeURIComponent(runtimePackage)}`;
    const hcMainUrl = "healthconnect://";

    // Intent actions (support varies by Android / Health Connect version).
    const ACTION_HEALTH_CONNECT_SETTINGS =
      "androidx.health.ACTION_HEALTH_CONNECT_SETTINGS";
    const ACTION_SHOW_PERMISSIONS_RATIONALE =
      "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE";

    try {
      // 1) Try opening Health Connect settings UI (Android 14+ / some builds)
      console.log(
        "[HealthConnectUI] trying IntentLauncher ACTION_HEALTH_CONNECT_SETTINGS",
      );
      await IntentLauncher.startActivityAsync(
        ACTION_HEALTH_CONNECT_SETTINGS as any,
      );
      return;
    } catch (e1) {
      console.warn(
        "[HealthConnectUI] ACTION_HEALTH_CONNECT_SETTINGS failed",
        e1,
      );
    }

    try {
      // 2) Try rationale/permissions activity (if available on device)
      console.log(
        "[HealthConnectUI] trying IntentLauncher ACTION_SHOW_PERMISSIONS_RATIONALE",
      );
      await IntentLauncher.startActivityAsync(
        ACTION_SHOW_PERMISSIONS_RATIONALE as any,
        {
          // Some implementations look for these extras.
          extra: {
            packageName: runtimePackage,
          },
        },
      );
      return;
    } catch (e2) {
      console.warn(
        "[HealthConnectUI] ACTION_SHOW_PERMISSIONS_RATIONALE failed",
        e2,
      );
    }

    try {
      // 3) Deep links (often unsupported)
      const canOpenPermission = await Linking.canOpenURL(hcPermissionUrl);
      const canOpenMain = await Linking.canOpenURL(hcMainUrl);
      const canOpenMarket = await Linking.canOpenURL(marketUrl);

      console.log("[HealthConnectUI] canOpenURL", {
        hcPermissionUrl: canOpenPermission,
        hcMainUrl: canOpenMain,
        marketUrl: canOpenMarket,
      });

      if (canOpenPermission) {
        console.log(
          "[HealthConnectUI] opening hcPermissionUrl",
          hcPermissionUrl,
        );
        await Linking.openURL(hcPermissionUrl);
        return;
      }

      if (canOpenMain) {
        console.log("[HealthConnectUI] opening hcMainUrl", hcMainUrl);
        await Linking.openURL(hcMainUrl);
        return;
      }

      // 4) Store/web fallback
      console.log(
        "[HealthConnectUI] opening store/web fallback",
        canOpenMarket ? marketUrl : webUrl,
      );
      await Linking.openURL(canOpenMarket ? marketUrl : webUrl);
    } catch (e3) {
      console.warn(
        "[HealthConnectUI] openHealthConnect failed, opening webUrl",
        e3,
      );
      await Linking.openURL(webUrl);
    }
  };

  const promptHealthConnectPermissions = useCallback(async () => {
    if (!isAndroid) {
      Alert.alert("Health Connect is only available on Android");
      return;
    }

    try {
      console.log("[HealthConnectUI] promptHealthConnectPermissions() pressed");
      console.log(
        "[HealthConnectUI] Current app package:",
        Application.applicationId,
      );

      await ensureHealthConnectReady();

      console.log(
        "[HealthConnectUI] About to call requestStepsAndHeartRatePermissions()",
      );
      console.log(
        "[HealthConnectUI] EXPECTATION: A SYSTEM DIALOG should appear OVER the app",
      );
      console.log(
        "[HealthConnectUI] If NO dialog appears, the permissions may not be properly configured in AndroidManifest",
      );

      // This triggers the SYSTEM PERMISSION DIALOG - this is the critical step!
      const result = await requestStepsAndHeartRatePermissions();
      console.log("[HealthConnectUI] permission result", result);
      console.log(
        "[HealthConnectUI] grantedPermissions:",
        JSON.stringify(result.grantedPermissions),
      );

      if (result.granted) {
        Alert.alert(
          "Permissions Granted",
          "Health Connect access has been granted. You can now sync steps and heart rate.",
        );
      } else {
        // Permissions were NOT granted
        console.log(
          "[HealthConnectUI] Permissions not granted. grantedPermissions:",
          result.grantedPermissions,
        );

        // Check if ANY permissions were granted
        const hasSomePermissions =
          result.grantedPermissions && result.grantedPermissions.length > 0;

        Alert.alert(
          "Permission Status",
          hasSomePermissions
            ? "Some permissions were granted, but not all. Please manually enable the remaining permissions in Health Connect."
            : "No permissions were granted. This usually means:\n\n1. You denied the permission dialog, OR\n2. The dialog didn't appear (check logs)\n\nTap 'Open Health Connect' to manually enable permissions.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Health Connect",
              onPress: async () => {
                console.log(
                  "[HealthConnectUI] Opening Health Connect for manual permission grant",
                );
                await openHealthConnect();
              },
            },
          ],
        );
      }
    } catch (e: any) {
      console.warn(
        "[HealthConnectUI] promptHealthConnectPermissions() error",
        e,
      );
      console.warn("[HealthConnectUI] error stack:", e?.stack);
      Alert.alert(
        "Health Connect",
        e?.message ?? "Failed to request Health Connect permissions.",
      );
    }
  }, [ensureHealthConnectReady]);

  const fetchSteps = useCallback(async () => {
    if (!isAndroid) {
      Alert.alert("Health Connect is only available on Android");
      return;
    }

    try {
      setStepsLoading(true);
      setStepsPoints([]);

      await ensureHealthConnectReady();

      // First, trigger the permission request dialog
      const permissionResult = await requestStepsAndHeartRatePermissions();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "To read step data, you need to grant permission in Health Connect.\n\n1. Tap 'Grant Permission' below\n2. Find your app in the list\n3. Enable 'Read' access for Steps",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Grant Permission",
              onPress: async () => {
                await openHealthConnect();
              },
            },
          ],
        );
        return;
      }

      const start = startOfDay(startDate);
      const end = endOfDay(endDate);

      const samples = await readStepsSamples({
        startTime: start,
        endTime: end,
      });

      // Hook up calories sync as well
      try {
        await readCaloriesSamples({
          startTime: start,
          endTime: end,
        });
      } catch (e) {
        console.warn("Failed to sync calories", e);
      }

      const byDay = new Map<string, number>();
      for (const s of samples) {
        const d = new Date(s.startTime);
        const key = toYMDLocal(d);
        byDay.set(key, (byDay.get(key) ?? 0) + (s.count ?? 0));
      }

      const points: StepsPoint[] = [];
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = toYMDLocal(cursor);
        points.push({ label: key.slice(5), value: byDay.get(key) ?? 0 });
        cursor.setDate(cursor.getDate() + 1);
      }

      setStepsPoints(points);
    } catch (err: any) {
      console.log("Failed to fetch steps from Health Connect", {
        message: err?.message,
      });
      Alert.alert(
        "Could not load steps",
        err?.message ??
          "Please confirm Health Connect permissions and try again.",
      );
    } finally {
      setStepsLoading(false);
    }
  }, [startDate, endDate, ensureHealthConnectReady]);

  const fetchHeartRate = useCallback(async () => {
    if (!isAndroid) {
      Alert.alert("Health Connect is only available on Android");
      return;
    }

    try {
      setHeartRateLoading(true);
      setHeartRatePoints([]);

      await ensureHealthConnectReady();

      // First, trigger the permission request dialog
      const permissionResult = await requestStepsAndHeartRatePermissions();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "To read heart rate data, you need to grant permission in Health Connect.\n\n1. Tap 'Grant Permission' below\n2. Find your app in the list\n3. Enable 'Read' access for Heart Rate",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Grant Permission",
              onPress: async () => {
                await openHealthConnect();
              },
            },
          ],
        );
        return;
      }

      const start = startOfDay(startDate);
      const end = endOfDay(endDate);

      const samples = await readHeartRateSamples({
        startTime: start,
        endTime: end,
      });

      // Aggregate by day: average bpm.
      const sums = new Map<string, { sum: number; n: number }>();
      for (const s of samples) {
        const d = new Date(s.time);
        const key = toYMDLocal(d);
        const cur = sums.get(key) ?? { sum: 0, n: 0 };
        sums.set(key, { sum: cur.sum + (s.bpm ?? 0), n: cur.n + 1 });
      }

      const points: HeartRatePoint[] = [];
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = toYMDLocal(cursor);
        const v = sums.get(key);
        points.push({
          label: key.slice(5),
          value: v && v.n ? Math.round(v.sum / v.n) : 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      setHeartRatePoints(points);
    } catch (err: any) {
      console.log("Failed to fetch heart rate from Health Connect", {
        message: err?.message,
      });
      Alert.alert(
        "Could not load heart rate",
        err?.message ??
          "Please confirm Health Connect permissions and try again.",
      );
    } finally {
      setHeartRateLoading(false);
    }
  }, [startDate, endDate, ensureHealthConnectReady]);

  // Initialize Health Connect on mount
  useEffect(() => {
    (async () => {
      if (isAndroid) {
        try {
          await ensureHealthConnectReady();
        } catch (err) {
          // Error already handled in ensureHealthConnectReady
        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchMeasurements(), fetchGlucoseMeasurements()]);
      setLoading(false);
    })();
  }, [fetchMeasurements, fetchGlucoseMeasurements]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchMeasurements(), fetchGlucoseMeasurements()]);
    }, [fetchMeasurements, fetchGlucoseMeasurements]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMeasurements(), fetchGlucoseMeasurements()]);
    if (activeSection === "watch") {
      await Promise.all([fetchHeartRate(), fetchSteps()]);
    }
    setRefreshing(false);
  }, [
    fetchMeasurements,
    fetchGlucoseMeasurements,
    activeSection,
    fetchHeartRate,
    fetchSteps,
  ]);

  const handleWatchSectionPress = async () => {
    if (!isAndroid) {
      Alert.alert(
        "Platform Not Supported",
        "Health Connect (for heart rate and steps) is only available on Android devices.",
      );
      return;
    }

    if (!healthConnectAvailable) {
      Alert.alert(
        "Health Connect Not Available",
        healthConnectError ??
          "Health Connect is not available on this device. Please install it from the Play Store (Android 13 and below) or enable it in settings (Android 14+).",
      );
      return;
    }

    setActiveSection("watch");
    await Promise.all([fetchHeartRate(), fetchSteps()]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Health</Text>
        <Text style={styles.subTitle}>
          {toYMDLocal(startDate)} → {toYMDLocal(endDate)}
        </Text>
      </View>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onChange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
      />

      {activeSection === "watch" ? (
        <>
          <View style={styles.watchBackRow}>
            <Button
              title="← Check my blood pressure/glucose"
              onPress={() => setActiveSection("readings")}
              gradient={gradient.green as [string, string]}
            />
          </View>

          {!isAndroid ? (
            <View style={styles.platformWarning}>
              <Text style={styles.warningTitle}>Android Only</Text>
              <Text style={styles.warningText}>
                Heart rate and step count syncing via Health Connect is only
                available on Android devices.
              </Text>
            </View>
          ) : !healthConnectAvailable ? (
            <View style={styles.platformWarning}>
              <Text style={styles.warningTitle}>
                Health Connect Unavailable
              </Text>
              <Text style={styles.warningText}>
                {healthConnectError ??
                  "Health Connect is not available on this device."}
              </Text>
              <Text style={styles.warningSubtext}>
                • Android 14+: Health Connect is built-in. Check Settings → Apps
                → Health Connect.{"\n"}• Android 13 and below: Install from Play
                Store.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.permissionRow}>
                <Button
                  title="Grant Health Connect Permissions"
                  onPress={promptHealthConnectPermissions}
                  gradient={gradient.green as [string, string]}
                />
              </View>

              {heartRateLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Loading heart rate…</Text>
                </View>
              ) : (
                <HeartRateChart points={heartRatePoints} />
              )}

              {stepsLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Loading steps…</Text>
                </View>
              ) : (
                <StepsChart points={stepsPoints} />
              )}

              <View style={styles.buttonRow}>
                <View style={styles.buttonItem}>
                  <Button
                    title="Sync Heart Rate"
                    onPress={fetchHeartRate}
                    gradient={gradient.green as [string, string]}
                  />
                </View>
                <View style={styles.buttonItem}>
                  <Button
                    title="Sync Step Count"
                    onPress={fetchSteps}
                    gradient={gradient.green as [string, string]}
                  />
                </View>
              </View>
            </>
          )}
        </>
      ) : loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading readings…</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Blood Pressure</Text>
          <BloodPressureChart measurements={measurements} />

          {measurements.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No readings found</Text>
              <Text style={styles.emptySub}>
                Try a wider date range, or add an entry.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Blood Glucose</Text>
          <BloodGlucoseChart measurements={glucoseMeasurements} />

          {glucoseMeasurements.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No readings found</Text>
              <Text style={styles.emptySub}>
                Try a wider date range, or add an entry.
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <View style={styles.buttonItem}>
              <Button
                title="Log Blood Pressure"
                onPress={() => router.push("/health/add-blood-pressure")}
                gradient={gradient.green as [string, string]}
              />
            </View>
            <View style={styles.buttonItem}>
              <Button
                title="Log Blood Glucose"
                onPress={() => router.push("/health/add-blood-glucose")}
                gradient={gradient.green as [string, string]}
              />
            </View>
          </View>

          <View style={styles.watchCtaRow}>
            <Button
              title="Check my heart rate and step count  →"
              onPress={handleWatchSectionPress}
              gradient={gradient.green as [string, string]}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 12, paddingBottom: 24 },
  permissionRow: { marginTop: 10, marginBottom: 10 },

  headerRow: { marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  subTitle: { marginTop: 2, fontSize: 12, color: "#6B7280" },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 6,
  },

  loadingBox: {
    height: 180,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: "#6B7280", fontSize: 12 },

  emptyBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: color.white,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  emptySub: { fontSize: 12, color: "#6B7280" },

  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  buttonItem: { flex: 1 },
  buttonItemWide: { flex: 1 },

  watchCtaRow: {
    marginTop: 12,
  },
  watchBackRow: {
    marginTop: 6,
    marginBottom: 10,
  },

  platformWarning: {
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 20,
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
    marginTop: 4,
  },
});
