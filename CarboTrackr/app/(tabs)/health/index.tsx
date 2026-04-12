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
import { gradient } from "../../../shared/constants/colors";

import StepsChart, {
  type StepsPoint,
} from "../../../features/health/components/StepsChart";
import HeartRateChart, {
  type HeartRatePoint,
} from "../../../features/health/components/HeartRateChart";

import {
  ensureHealthConnectInitialized,
  requestHealthDataPermissions,
  readTotalSteps,
  readTotalCalories,
  readMostRecentHeartRate,
} from "../../../features/health/healthConnect";

import { createWatchMetric } from "../../../features/health/api/post-watch-data";
import { getWatchMetrics } from "../../../features/health/api/get-watch-data";

import {
  getBloodPressureReport,
  type BpMeasurement,
} from "../../../features/health/api/get-blood-pressures";

import {
  getBloodGlucoseReport,
  type GlucoseMeasurement,
} from "../../../features/health/api/get-blood-glucose";

import { useAuth } from "@clerk/clerk-expo";

// ─── Date helpers ────────────────────────────────────────────────────────────
const toYMDLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const toHHmm = (d: Date) => {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// Health Connect is only available on Android
const isAndroid = Platform.OS === "android";

// ─── Sync logger ─────────────────────────────────────────────────────────────
const syncLog = (msg: string) => console.log(`[WatchSync] ${msg}`);

// ─────────────────────────────────────────────────────────────────────────────
export default function HealthIndexScreen() {
  const { userId } = useAuth();
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

  const [watchDataLoading, setWatchDataLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const [stepsPoints, setStepsPoints] = useState<StepsPoint[]>([]);
  const [heartRatePoints, setHeartRatePoints] = useState<HeartRatePoint[]>([]);

  const [healthConnectAvailable, setHealthConnectAvailable] = useState<
    boolean | null
  >(null);
  const [healthConnectError, setHealthConnectError] = useState<string | null>(
    null,
  );

  // ─── Blood pressure / glucose ───────────────────────────────────────────────

  const fetchMeasurements = useCallback(async () => {
    try {
      setMeasurements([]);
      const accountId = userId;
      if (!accountId) throw new Error("User ID from Clerk Auth API not found");
      const { measurements: cleaned } = await getBloodPressureReport({
        accountId,
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
      });
      setMeasurements(cleaned);
    } catch (err: any) {
      console.warn("[Health] Failed to fetch BP measurements:", err?.message);
    }
  }, [startDate, endDate, userId]);

  const fetchGlucoseMeasurements = useCallback(async () => {
    try {
      setGlucoseMeasurements([]);
      const accountId = userId;
      if (!accountId) throw new Error("User ID from Clerk Auth API not found");
      const { measurements: cleaned } = await getBloodGlucoseReport({
        accountId,
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
      });
      setGlucoseMeasurements(cleaned);
    } catch (err: any) {
      console.warn(
        "[Health] Failed to fetch glucose measurements:",
        err?.message,
      );
    }
  }, [startDate, endDate, userId]);

  // ─── Health Connect setup ────────────────────────────────────────────────────

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
    const runtimePackage =
      Application.applicationId || Application.applicationName || "unknown";
    const marketUrl =
      "market://details?id=com.google.android.apps.healthdata";
    const webUrl =
      "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata";
    const hcPermissionUrl = `healthconnect://permissions?packageName=${encodeURIComponent(runtimePackage)}`;
    const hcMainUrl = "healthconnect://";
    try {
      await IntentLauncher.startActivityAsync(
        "androidx.health.ACTION_HEALTH_CONNECT_SETTINGS" as any,
      );
      return;
    } catch (_) {}
    try {
      await IntentLauncher.startActivityAsync(
        "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" as any,
        { extra: { packageName: runtimePackage } },
      );
      return;
    } catch (_) {}
    try {
      const canPerm = await Linking.canOpenURL(hcPermissionUrl);
      const canMain = await Linking.canOpenURL(hcMainUrl);
      const canMarket = await Linking.canOpenURL(marketUrl);
      if (canPerm) { await Linking.openURL(hcPermissionUrl); return; }
      if (canMain) { await Linking.openURL(hcMainUrl); return; }
      await Linking.openURL(canMarket ? marketUrl : webUrl);
    } catch (_) {
      await Linking.openURL(webUrl);
    }
  };

  const promptHealthConnectPermissions = useCallback(async () => {
    if (!isAndroid) {
      Alert.alert("Health Connect is only available on Android");
      return;
    }
    try {
      await ensureHealthConnectReady();
      const result = await requestHealthDataPermissions();
      if (result.granted) {
        Alert.alert(
          "Permissions Granted",
          "Health Connect access has been granted. You can now sync metrics.",
        );
      } else {
        const hasSome =
          result.grantedPermissions && result.grantedPermissions.length > 0;
        Alert.alert(
          "Permission Status",
          hasSome
            ? "Some permissions were granted but not all. Please enable the remaining in Health Connect."
            : "No permissions were granted. Tap 'Open Health Connect' to manually enable them.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Health Connect", onPress: openHealthConnect },
          ],
        );
      }
    } catch (e: any) {
      Alert.alert(
        "Health Connect",
        e?.message ?? "Failed to request Health Connect permissions.",
      );
    }
  }, [ensureHealthConnectReady]);

  // ─── Watch charts (loaded from backend) ─────────────────────────────────────

  /**
   * Load watch charts from the backend using the currently selected date range.
   * Called on section enter, date change, and after a successful sync.
   */
  const fetchWatchData = useCallback(async () => {
    try {
      setWatchDataLoading(true);
      const accountId = userId;
      if (!accountId) throw new Error("User ID from Clerk Auth API not found");

      const res = await getWatchMetrics({
        profile_id: accountId,
        from: startOfDay(startDate).toISOString(),
        to: endOfDay(endDate).toISOString(),
        limit: 500,
      });

      const rows = (res.data ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(a.measured_at).getTime() -
            new Date(b.measured_at).getTime(),
        );

      setStepsPoints(
        rows.map((r) => ({
          label: toHHmm(new Date(r.measured_at)),
          value: Number(r.steps_count) || 0,
        })),
      );
      setHeartRatePoints(
        rows.map((r) => ({
          label: toHHmm(new Date(r.measured_at)),
          value: Number(r.heart_rate_bpm) || 0,
        })),
      );
    } catch (err: any) {
      console.warn(
        "[Health] Failed to fetch watch data from backend:",
        err?.message,
      );
    } finally {
      setWatchDataLoading(false);
    }
  }, [startDate, endDate, userId]);

  // ─── Sync all metrics ────────────────────────────────────────────────────────

  /**
   * Reads the most recent data from Health Connect (always from today),
   * sends it to the backend as one combined metric record, then refreshes charts.
   */
  const syncAll = useCallback(async () => {
    if (!isAndroid) {
      Alert.alert("Health Connect is only available on Android");
      return;
    }

    try {
      setSyncLoading(true);
      await ensureHealthConnectReady();

      const permissionResult = await requestHealthDataPermissions();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant Health Connect permissions and try again.",
        );
        return;
      }

      const accountId = userId;
      if (!accountId) throw new Error("User ID not found");

      // Always read from start-of-today → now for the absolute latest data
      const now = new Date();
      const todayStart = startOfDay(now);

      syncLog("──────────────────────────────────────────────────────");
      syncLog("Reading from Health Connect...");
      syncLog(
        `Time window: today (${toYMDLocal(todayStart)}) → ${toHHmm(now)}`,
      );

      // ── Read all three in parallel ──────────────────────────────────────────
      // Steps   : aggregateRecord → COUNT_TOTAL (Google Fit preferred)
      // Calories: aggregateRecord → ENERGY_TOTAL.inCalories (Samsung Health)
      // HR      : readRecords → most-recent sample   (Samsung Health)
      const [stepsResult, hrResult, caloriesResult] = await Promise.all([
        readTotalSteps(todayStart, now).catch((e: any) => {
          syncLog(`Steps error: ${e?.message}`);
          return { totalSteps: 0, dataOrigins: [] };
        }),

        readMostRecentHeartRate([
          "com.samsung.android.fitness",
          "com.sec.android.app.shealth",
        ]).catch((e: any) => {
          syncLog(`HeartRate error: ${e?.message}`);
          return null;
        }),

        readTotalCalories(todayStart, now, [
          "com.samsung.android.fitness",
          "com.sec.android.app.shealth",
        ]).catch((e: any) => {
          syncLog(`Calories error: ${e?.message}`);
          return { totalCalories: 0, dataOrigins: [] };
        }),
      ]);

      // ── Extract values ──────────────────────────────────────────────────────
      const totalSteps = stepsResult.totalSteps;
      const latestBpm = hrResult?.bpm ?? 1;
      const latestHrTime = hrResult?.time ?? now.toISOString();
      const latestHrSource = hrResult?.source ?? "unknown";
      // totalCalories is already in Calories (not kcal)
      const totalCalories = caloriesResult.totalCalories;

      // ── Structured log ──────────────────────────────────────────────────────
      syncLog(
        `Steps      : ${totalSteps} (aggregated total) | origins: ${stepsResult.dataOrigins.join(", ") || "none"}`,
      );
      if (hrResult) {
        syncLog(
          `HeartRate  : ${latestBpm} bpm (most-recent sample) | source: ${latestHrSource} | time: ${latestHrTime}`,
        );
      } else {
        syncLog("HeartRate  : no sample in last 24 h — defaulting to 1 bpm");
      }
      syncLog(
        `Calories   : ${totalCalories} kcal (aggregated total) | origins: ${caloriesResult.dataOrigins.join(", ") || "none"}`,
      );

      syncLog("──────────────────────────────────────────────────────");
      syncLog("Sending to backend...");

      // Use HR measurement time as the record timestamp when available so the
      // entry is anchored to when the data was actually recorded, not synced.
      const measuredAt = hrResult?.time ?? now.toISOString();

      const payload = {
        profile_id: accountId,
        heart_rate_bpm: Math.max(1, latestBpm),
        steps_count: Math.max(0, totalSteps),
        // Column is named calories_burned_kcal in the DB but stores raw Calories
        calories_burned_kcal: Math.max(0, totalCalories),
        measured_at: measuredAt,
      };

      syncLog(
        `Payload    : steps=${payload.steps_count}, hr=${payload.heart_rate_bpm} bpm, calories=${payload.calories_burned_kcal} cal, measured_at=${payload.measured_at}`,
      );

      const response = await createWatchMetric(payload);

      if (response?.status === "Success" || response?.data) {
        syncLog(
          `Result     : SUCCESS ✓ | backend id: ${response?.data?.id ?? "n/a"}`,
        );
        // Refresh charts so the newly-saved row appears immediately
        await fetchWatchData();
        syncLog("Charts updated ✓");
      } else {
        syncLog(
          `Result     : FAILED ✗ | message: ${response?.message ?? "unknown"}`,
        );
      }

      syncLog("──────────────────────────────────────────────────────");
    } catch (err: any) {
      const httpBody = err?.response?.data;
      const httpStatus = err?.response?.status;
      const detail = httpBody
        ? `HTTP ${httpStatus}: ${JSON.stringify(httpBody)}`
        : err?.message ?? "Unknown error";
      syncLog(`ERROR: ${detail}`);
      console.error("[WatchSync] Full error:", httpBody ?? err?.message, err);
      Alert.alert("Sync failed", detail);
    } finally {
      setSyncLoading(false);
    }
  }, [ensureHealthConnectReady, fetchWatchData]);

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  // Initialize Health Connect on mount
  useEffect(() => {
    if (isAndroid) {
      ensureHealthConnectReady().catch(() => {});
    }
  }, []);

  // Load blood pressure + glucose data on mount and date change
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchMeasurements(), fetchGlucoseMeasurements()]);
      setLoading(false);
    })();
  }, [fetchMeasurements, fetchGlucoseMeasurements, userId]);

  // Reload BP/glucose when screen is focused
  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchMeasurements(), fetchGlucoseMeasurements()]);
    }, [fetchMeasurements, fetchGlucoseMeasurements, userId]),
  );

  // Load watch chart data from backend whenever section or date range changes
  useEffect(() => {
    if (activeSection === "watch") {
      fetchWatchData();
    }
  }, [activeSection, startDate, endDate, fetchWatchData, userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMeasurements(), fetchGlucoseMeasurements()]);
    if (activeSection === "watch") {
      await fetchWatchData();
    }
    setRefreshing(false);
  }, [fetchMeasurements, fetchGlucoseMeasurements, activeSection, fetchWatchData]);

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
    // fetchWatchData is triggered via the useEffect above on activeSection change
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
                • Android 14+: Health Connect is built-in. Check Settings →
                Apps → Health Connect.{"\n"}• Android 13 and below: Install
                from Play Store.
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

              {watchDataLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>Loading charts…</Text>
                </View>
              ) : (
                <>
                  <HeartRateChart points={heartRatePoints} />
                  <StepsChart points={stepsPoints} />
                </>
              )}

              <View style={styles.buttonRow}>
                <View style={styles.buttonItemWide}>
                  <Button
                    title={syncLoading ? "Syncing…" : "Sync All Metrics"}
                    onPress={syncAll}
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
          <BloodPressureChart measurements={measurements} />

          <BloodGlucoseChart measurements={glucoseMeasurements} />

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
    flex: 1,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: "#6B7280", fontSize: 12 },


  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  buttonItem: { flex: 1 },
  buttonItemWide: { flex: 1 },

  watchCtaRow: { marginTop: 12 },
  watchBackRow: { marginTop: 6, marginBottom: 10 },

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
