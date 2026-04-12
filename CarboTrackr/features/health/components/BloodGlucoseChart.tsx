import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
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
  tooltipDate: string;
  tooltipTime: string;
  color: string;
  dataPointColor: string;
  dataPointText: string;
  textColor: string;
  textFontSize: number;
  textShiftX: number;
  textShiftY: number;
};

const LABEL_HEIGHT = 0;
const CARD_BORDER_WIDTH = 2.5;
const CARD_RADIUS = 12;
const EMPTY_STATE_HEIGHT = 96;
const CHART_HEIGHT = 200;

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
          tooltipDate: formatLabelMMMdd(measurement.created_at),
          tooltipTime: formatTimehhmm(measurement.created_at),
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  <LineChart
                    initialSpacing={0}
                    data={chartData}
                    height={CHART_HEIGHT}
                    width={Math.max(chartData.length * 130, 360)}
                    spacing={90}
                    color="#000000"
                    thickness={2}
                    dataPointsRadius={5}
                    xAxisLabelsHeight={LABEL_HEIGHT}
                    textColor1="#111827"
                    textShiftY={-10}
                    textShiftX={-8}
                    textFontSize={10}
                    yAxisColor="#E5E7EB"
                    yAxisTextStyle={styles.yAxisText}
                    yAxisThickness={1}
                    xAxisThickness={0}
                    rulesColor="#E5E7EB"
                    rulesThickness={1}
                    focusEnabled
                    pointerConfig={{
                      activatePointersOnLongPress: true,
                      autoAdjustPointerLabelPosition: true,
                      pointerStripHeight: CHART_HEIGHT,
                      pointerStripColor: "#D1D5DB",
                      pointerColor: "#6B7280",
                      radius: 4,
                      pointerLabelWidth: 150,
                      pointerLabelHeight: 34,
                      pointerLabelComponent: (items: any[]) => {
                        const selected = items?.[0];
                        const dateText = selected?.tooltipDate ?? "";
                        const timeText = selected?.tooltipTime ?? "";
                        return (
                          <View style={styles.tooltip}>
                            {dateText ? (
                              <Text style={styles.tooltipText}>{dateText}</Text>
                            ) : null}
                            {timeText ? (
                              <Text style={styles.tooltipText}>{timeText}</Text>
                            ) : (
                              <Text style={styles.tooltipText}>{selected?.label ?? ""}</Text>
                            )}
                          </View>
                        );
                      },
                    }}
                  />
                </ScrollView>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.noDataText}>
                  No recorded blood glucose available. Try a wider range, or add an
                  entry.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.legend}>
            <LegendItem color={color.fuschia} label="Critical High (>= 300)" />
            <LegendItem
              color={color.red}
              label="Diabetes (PRE: 126-299 | POST: 200-299)"
            />
            <LegendItem
              color={color.yellow}
              label="Prediabetes (PRE: 100-125 | POST: 140-199)"
            />
            <LegendItem
              color={color.green}
              label="Normal (PRE: 70-99 | POST: 70-139)"
            />
            <LegendItem color={color.blue} label="Low (< 70)" />
          </View>
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
  tooltip: {
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  tooltipText: {
    fontSize: 11,
    color: "#374151",
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginTop: 8,
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
});
