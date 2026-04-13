import React, { useMemo, useRef, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { color, gradient } from "../../../shared/constants/colors";

export type HeartRatePoint = {
  label: string;
  value: number;
};

export default function HeartRateChart({
  points,
  error,
}: {
  points: HeartRatePoint[];
  error?: string | null;
}) {
  const scrollRef = useRef<ScrollView>(null);

  const chartData = useMemo(() => {
    const data =
      Array.isArray(points) && points.length > 0
        ? points.map((p) => ({
            value: Number(p.value) || 0,
            label: p.label,
          }))
        : [];
    return data;
  }, [points]);

  useEffect(() => {
    if (chartData.length > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [chartData.length]);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Ionicons name="heart" size={20} color="#111827" />
        <Text style={styles.title}>Heart Rate</Text>
        <View style={{ width: 20 }} />
      </View>

      <LinearGradient
        colors={gradient.green as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.card}>
          {chartData.length > 0 ? (
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <LineChart
                data={chartData}
                height={200}
                width={Math.max(chartData.length * 100, 420)}
                color={color.red}
                thickness={2}
                dataPointsRadius={4}
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={styles.xLabel}
                rulesColor="#E5E7EB"
                rulesThickness={1}
                spacing={90}
                curved
              />
            </ScrollView>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.noDataText}>
                {error ??
                  "No recorded heart rate available. Try a wider range, or sync metrics."}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 2 },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  cardBorder: {
    borderRadius: 12,
    padding: 2.5,
    overflow: "hidden",
  },
  card: {
    backgroundColor: color.white,
    borderRadius: 9.5,
    padding: 12,
  },
  scrollContent: { paddingRight: 6, paddingBottom: 4 },
  xLabel: { fontSize: 10, color: "#6B7280" },
  emptyChart: {
    minHeight: 96,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  noDataText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 19,
    textAlign: "center",
  },
});
