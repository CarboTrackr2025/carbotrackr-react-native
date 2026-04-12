import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { LinearGradient } from "expo-linear-gradient";
import { color, gradient } from "../../../shared/constants/colors";
import { Ionicons } from "@expo/vector-icons";

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

type GlucoseChartPoint = {
  value: number;
  label: string;
  color: string;
  dataPointColor: string;
  dataPointText: string;
  textColor: string;
  textFontSize: number;
  textShiftX: number;
  textShiftY: number;
};

const LABEL_HEIGHT = 20;
const Y_AXIS_WIDTH = 36;
const CARD_BORDER_WIDTH = 2.5;
const CARD_RADIUS = 12;
const EMPTY_STATE_HEIGHT = 96;
const CHART_HEIGHT = 200;
const Y_AXIS_SECTIONS = 4;
const Y_AXIS_MIN_FLOOR = 0;
const Y_AXIS_MAX_CEILING = 400;
const Y_AXIS_MIN_SPAN = 80;
const Y_AXIS_PADDING_RATIO = 0.15;
const Y_AXIS_ROUND_TO = 10;
const NICE_STEP_CANDIDATES = [10, 20, 25, 50];

const roundDownTo = (value: number, step: number) =>
  Math.floor(value / step) * step;
const roundUpTo = (value: number, step: number) =>
  Math.ceil(value / step) * step;

const pickNiceStep = (roughStep: number) => {
  const positiveStep = Math.max(1, roughStep);
  const fromCandidates = NICE_STEP_CANDIDATES.find(
    (step) => positiveStep <= step,
  );
  if (fromCandidates) return fromCandidates;
  return roundUpTo(positiveStep, Y_AXIS_ROUND_TO);
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

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

const computeYAxisDomain = (values: number[]) => {
  if (values.length === 0) {
    return {
      min: Y_AXIS_MIN_FLOOR,
      max: Y_AXIS_MIN_FLOOR + Y_AXIS_MIN_SPAN,
      step: Y_AXIS_MIN_SPAN / Y_AXIS_SECTIONS,
    };
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(1, rawMax - rawMin);
  const padding = Math.max(8, Math.round(span * Y_AXIS_PADDING_RATIO));

  let desiredMin = Math.max(Y_AXIS_MIN_FLOOR, rawMin - padding);
  let desiredMax = Math.min(Y_AXIS_MAX_CEILING, rawMax + padding);

  if (desiredMax - desiredMin < Y_AXIS_MIN_SPAN) {
    const center = (desiredMin + desiredMax) / 2;
    desiredMin = Math.max(Y_AXIS_MIN_FLOOR, center - Y_AXIS_MIN_SPAN / 2);
    desiredMax = Math.min(Y_AXIS_MAX_CEILING, center + Y_AXIS_MIN_SPAN / 2);
  }

  const step = pickNiceStep((desiredMax - desiredMin) / Y_AXIS_SECTIONS);

  let min = roundDownTo(desiredMin, step);
  min = Math.max(Y_AXIS_MIN_FLOOR, min);

  let max = min + step * Y_AXIS_SECTIONS;

  if (max < desiredMax) {
    max = roundUpTo(desiredMax, step);
    min = Math.max(Y_AXIS_MIN_FLOOR, max - step * Y_AXIS_SECTIONS);
  }

  if (min > desiredMin) {
    min = Math.max(Y_AXIS_MIN_FLOOR, min - step);
    max = min + step * Y_AXIS_SECTIONS;
  }

  if (max > Y_AXIS_MAX_CEILING) {
    max = Y_AXIS_MAX_CEILING;
    min = Math.max(Y_AXIS_MIN_FLOOR, max - step * Y_AXIS_SECTIONS);
  }

  return { min, max, step };
};

export default function BloodGlucoseChart({ measurements }: Props) {
  const source = measurements ?? [];
  // Start collapsed so new users see 'See more' first
  const [legendCollapsed, setLegendCollapsed] = useState(true);

  const chartData = useMemo<GlucoseChartPoint[]>(() => {
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
          label: `${formatLabelMMMdd(measurement.created_at)} ${formatTimehhmm(
            measurement.created_at,
          )}`,
          color: "#000000",
          dataPointColor: pointColor,
          dataPointText: String(measurement.level),
          textColor: "#111827",
          textFontSize: 10,
          textShiftX: -8,
          textShiftY: -10,
        };
      });
  }, [source]);

  const yAxisDomain = useMemo(() => {
    return computeYAxisDomain(chartData.map((point) => point.value));
  }, [chartData]);

  const yAxisTicks = useMemo(() => {
    return Array.from({ length: Y_AXIS_SECTIONS + 1 }, (_, i) =>
      yAxisDomain.max - i * yAxisDomain.step,
    );
  }, [yAxisDomain]);

  const toTickOffset = (value: number) => {
    const ratio = clamp01((value - yAxisDomain.min) / (yAxisDomain.max - yAxisDomain.min));
    return Math.round(ratio * CHART_HEIGHT);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Ionicons name="water" size={20} color="#111827" />
        <Text style={styles.title}>Blood Glucose</Text>
        <View style={{ width: 20 }} />
      </View>

      <LinearGradient
        colors={gradient.green as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.card}>
          <View style={styles.chartWrap}>
            {chartData.length > 0 ? (
              <View style={styles.chartRow}>
                <View style={styles.yAxis}>
                  <View style={styles.yAxisPlot}>
                    {yAxisTicks.map((tick) => (
                      <View key={tick} style={[styles.yAxisTick, { bottom: toTickOffset(tick) - 7 }]}>
                        <Text style={styles.yAxisText}>{tick}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.yAxisLabelSpacer} />
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  <LineChart
                    data={chartData}
                    height={CHART_HEIGHT}
                    width={Math.max(chartData.length * 120, 400)}
                    maxValue={yAxisDomain.max}
                    yAxisOffset={yAxisDomain.min}
                    stepValue={yAxisDomain.step}
                    noOfSections={Y_AXIS_SECTIONS}
                    color="#000000"
                    thickness={2}
                    dataPointsRadius={5}
                    dataPointsColor="#000000"
                    xAxisLabelsHeight={LABEL_HEIGHT}
                    xAxisLabelTextStyle={styles.xLabel}
                    showValuesAsDataPointsText
                    hideYAxisText
                    yAxisThickness={0}
                    xAxisThickness={0}
                    rulesColor="#E5E7EB"
                    rulesThickness={1}
                    spacing={80}
                  />
                </ScrollView>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.noDataText}>No recorded blood glucose available. Try a wider range, or add an entry.</Text>
              </View>
            )}
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
    borderRadius: CARD_RADIUS,
    padding: CARD_BORDER_WIDTH,
    overflow: "hidden",
  },
  card: {
    backgroundColor: color.white,
    borderRadius: CARD_RADIUS - CARD_BORDER_WIDTH,
    padding: 8,
  },
  chartWrap: {
    width: "100%",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  yAxis: {
    width: Y_AXIS_WIDTH,
    marginRight: 4,
  },
  yAxisPlot: {
    height: CHART_HEIGHT,
    position: "relative",
  },
  yAxisTick: {
    position: "absolute",
    right: 0,
  },
  yAxisLabelSpacer: {
    height: LABEL_HEIGHT,
  },
  scrollContent: {
    paddingRight: 6,
    paddingBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  emptyChart: {
    height: EMPTY_STATE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  yAxisText: {
    fontSize: 10,
    color: "#6B7280",
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginTop: 2,
  },
  legendToggle: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: -4,
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
