import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

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
    const init = await ensureHealthConnectInitialized();
    if (!init.initialized) {
      throw new Error(
        init.error ??
          "Health Connect could not be initialized. Ensure Health Connect is installed and set up.",
      );
    }
    await requestStepsAndHeartRatePermissions();
  }, []);

  const fetchSteps = useCallback(async () => {
    try {
      setStepsLoading(true);
      setStepsPoints([]);

      await ensureHealthConnectReady();

      const start = startOfDay(startDate);
      const end = endOfDay(endDate);

      const samples = await readStepsSamples({
        startTime: start,
        endTime: end,
      });

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
    try {
      setHeartRateLoading(true);
      setHeartRatePoints([]);

      await ensureHealthConnectReady();

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
              onPress={async () => {
                setActiveSection("watch");
                await Promise.all([fetchHeartRate(), fetchSteps()]);
              }}
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
});
