import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { LinearGradient } from "expo-linear-gradient";
import { color, gradient } from "../../../shared/constants/colors";

type MealContext = "PRE" | "POST" | null;

type GlucoseMeasurement = {
  id: string;
  level: number;
  created_at: string;
  meal_context?: MealContext;
};

type Props = {
  measurements?: GlucoseMeasurement[];
};

type GlucoseStatus =
  | "LOW"
  | "NORMAL"
  | "PREDIABETES"
  | "DIABETES"
  | "CRITICAL_HIGH";

const LABEL_HEIGHT = 24;
const CARD_BORDER_WIDTH = 2.5;
const CARD_RADIUS = 12;

const formatLabelMMMdd = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    .replace(" ", "-");
};

const formatTimehhmm = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getGlucoseStatus = (
  level: number,
  mealContext: MealContext,
): GlucoseStatus => {
  if (level < 70) return "LOW";
  if (level >= 300) return "CRITICAL_HIGH";

  if (mealContext === "POST") {
    if (level < 140) return "NORMAL";
    if (level < 200) return "PREDIABETES";
    return "DIABETES";
  }

  if (level < 100) return "NORMAL";
  if (level < 126) return "PREDIABETES";
  return "DIABETES";
};

const getGlucoseColor = (status: GlucoseStatus) => {
  switch (status) {
    case "LOW":
      return color.blue;
    case "NORMAL":
      return color.green;
    case "PREDIABETES":
      return color.yellow;
    case "CRITICAL_HIGH":
      return color.fuschia;
    case "DIABETES":
    default:
      return color.red;
  }
};

const LegendItem = ({ color: bg, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, { backgroundColor: bg }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

export default function BloodGlucoseChart({ measurements }: Props) {
  const source = measurements ?? [];
  // Start collapsed so new users see 'See more' first
  const [legendCollapsed, setLegendCollapsed] = useState(true);

  const chartData = useMemo(() => {
    return [...source]
      .filter(
        (measurement) =>
          Number.isFinite(measurement.level) &&
          !Number.isNaN(new Date(measurement.created_at).getTime()),
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .map((measurement) => {
        const status = getGlucoseStatus(
          measurement.level,
          measurement.meal_context ?? null,
        );
        const pointColor = getGlucoseColor(status);

        return {
          value: measurement.level,
          label: "",
          color: pointColor,
          dataPointColor: pointColor,
          labelComponent: () => (
            <View style={styles.pointLabelArea}>
              <Text style={styles.xLabel} numberOfLines={1}>
                {formatLabelMMMdd(measurement.created_at)}{" "}
                {formatTimehhmm(measurement.created_at)}
              </Text>
              <Text style={styles.measurementLabel} numberOfLines={1}>
                {measurement.level}
              </Text>
            </View>
          ),
        };
      });
  }, [source]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blood Glucose</Text>

      <LinearGradient
        colors={gradient.green as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.card}>
          <View style={styles.chartWrap}>
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
                  yAxisTextStyle={styles.yAxisText}
                  yAxisThickness={0}
                  xAxisThickness={0}
                  xAxisLabelsHeight={LABEL_HEIGHT}
                  rulesColor="#E5E7EB"
                  rulesThickness={1}
                  spacing={80}
                  curved
                />
              ) : (
                <Text style={styles.noDataText}>No data available</Text>
              )}
            </ScrollView>
          </View>

          {legendCollapsed ? (
            <Pressable
              style={styles.legendToggle}
              onPress={() => setLegendCollapsed(false)}
            >
              <Text style={styles.legendToggleText}>See more</Text>
            </Pressable>
          ) : (
            <>
              <View style={styles.legend}>
                <LegendItem color={color.fuschia} label="Critical High (>= 300)" />
                <LegendItem color={color.red} label="Diabetes" />
                <LegendItem color={color.yellow} label="Prediabetes" />
                <LegendItem color={color.green} label="Normal" />
                <LegendItem color={color.blue} label="Low (< 70)" />

                <View style={styles.noteBlock}>
                  <Text style={styles.noteText}>
                    {"Pre-meal: 70-99 normal, 100-125 prediabetes, >=126 diabetes"}
                  </Text>
                  <Text style={styles.noteText}>
                    {"Post-meal: 70-139 normal, 140-199 prediabetes, >=200 diabetes"}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.legendToggle}
                onPress={() => setLegendCollapsed(true)}
              >
                <Text style={styles.legendToggleText}>See less</Text>
              </Pressable>
            </>
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
    marginBottom: 10,
    color: "#111827",
  },
  cardBorder: {
    borderRadius: CARD_RADIUS,
    padding: CARD_BORDER_WIDTH,
    overflow: "hidden",
  },
  card: {
    backgroundColor: color.white,
    borderRadius: CARD_RADIUS - CARD_BORDER_WIDTH,
    padding: 12,
  },
  chartWrap: {
    width: "100%",
  },
  scrollContent: {
    paddingRight: 6,
    paddingBottom: 4,
  },
  noDataText: {
    fontSize: 14,
    color: "#9CA3AF",
    paddingVertical: 20,
  },
  yAxisText: {
    fontSize: 10,
    color: "#6B7280",
  },
  pointLabelArea: {
    height: LABEL_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -8,
  },
  xLabel: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
  },
  measurementLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  legend: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  legendToggle: {
    marginTop: 8,
    alignSelf: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  legendToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: color.green,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: color.black,
  },
  noteBlock: {
    width: "100%",
    marginTop: 6,
    gap: 4,
    alignItems: "center",
  },
  noteText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
});
