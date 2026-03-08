import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { color } from "../../../shared/constants/colors";

type GlucoseMeasurement = {
  id: string;
  level: number;
  created_at: string;
};

type Props = {
  measurements?: GlucoseMeasurement[];
};

const formatLabelMMMdd = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    .replace(" ", "-");
};

const evaluateBloodGlucose = (level: number) => {
  if (level < 70) return color.blue;
  if (level <= 99) return color.green;
  if (level <= 125) return color.yellow;
  return color.red;
};

export default function BloodGlucoseChart({ measurements }: Props) {
  const source = measurements ?? [];

  const chartData = useMemo(() => {
    return [...source]
      .filter(
        (m) =>
          Number.isFinite(m.level) &&
          !Number.isNaN(new Date(m.created_at).getTime()),
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .map((m) => ({
        value: m.level,
        label: formatLabelMMMdd(m.created_at),
        color: evaluateBloodGlucose(m.level),
      }));
  }, [source]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blood Glucose</Text>

      <View style={styles.card}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {chartData.length > 0 ? (
            <LineChart
              data={chartData}
              height={200}
              width={Math.max(chartData.length * 80, 400)}
              color={color.blue}
              thickness={2}
              dataPointsRadius={5}
              yAxisThickness={0}
              xAxisThickness={0}
              xAxisLabelTextStyle={{ fontSize: 10, color: "#6B7280" }}
              spacing={80}
              curved
            />
          ) : (
            <Text style={styles.noDataText}>No data available</Text>
          )}
        </ScrollView>

        <View style={styles.legend}>
          <LegendItem color={color.red} label="High / Very High" />
          <LegendItem color={color.yellow} label="Elevated" />
          <LegendItem color={color.green} label="Normal" />
          <LegendItem color={color.blue} label="Low" />
        </View>
      </View>
    </View>
  );
}

const LegendItem = ({ color: bg, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, { backgroundColor: bg }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 2 },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#111827",
  },
  card: {
    backgroundColor: color.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scrollContent: { paddingRight: 6, paddingBottom: 4 },
  noDataText: { fontSize: 14, color: "#9CA3AF", paddingVertical: 20 },
  legend: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 12, color: color.black },
});
