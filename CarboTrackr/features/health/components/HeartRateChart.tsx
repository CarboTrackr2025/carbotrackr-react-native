import React, { useMemo, useRef, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { color } from "../../../shared/constants/colors";

export type HeartRatePoint = {
  label: string;
  value: number;
};

export default function HeartRateChart({
  points,
}: {
  points: HeartRatePoint[];
}) {
  const scrollRef = useRef<ScrollView>(null);

  const chartData = useMemo(
    () =>
      (points ?? []).map((p) => ({
        value: Number(p.value) || 0,
        label: p.label,
      })),
    [points],
  );

  useEffect(() => {
    if (chartData.length > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [chartData.length]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Heart Rate Graph</Text>

      <View style={styles.card}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {chartData.length > 0 ? (
            <LineChart
              data={chartData}
              height={200}
              width={Math.max(chartData.length * 80, 400)}
              color={color.red}
              thickness={2}
              dataPointsRadius={4}
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
      </View>
    </View>
  );
}

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
});
