import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, gradient } from "../../../shared/constants/colors";
import { Ionicons } from "@expo/vector-icons";

type BpMeasurement = {
  id: string;
  systolic_mmHg: number;
  diastolic_mmHg: number;
  created_at: string;
};

type Props = {
  measurements?: BpMeasurement[];
};

type BPStatus =
  | "LOW"
  | "NORMAL"
  | "ELEVATED"
  | "STAGE_1"
  | "STAGE_2"
  | "SEVERE";

const PLOT_HEIGHT = 140;
const LABEL_HEIGHT = 42;
const CHART_HEIGHT = PLOT_HEIGHT + LABEL_HEIGHT;

const Y_AXIS_SECTIONS = 5;
const Y_AXIS_MIN_FLOOR = 40;
const Y_AXIS_MAX_CEILING = 240;
const Y_AXIS_MIN_SPAN = 40;
const Y_AXIS_PADDING_RATIO = 0.15;
const Y_AXIS_ROUND_TO = 10;
const NICE_STEP_CANDIDATES = [5, 10, 20, 25, 50];

const GROUP_WIDTH = 70;
const GROUP_GAP = 14;
const GROUP_PITCH = GROUP_WIDTH + GROUP_GAP;
const Y_AXIS_WIDTH = 34;
const CARD_BORDER_WIDTH = 2.5;
const CARD_RADIUS = 12;
const EMPTY_STATE_HEIGHT = 96;

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

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const evaluateBloodPressure = (systolic: number, diastolic: number): BPStatus => {
  if (systolic < 90 || diastolic < 60) return "LOW";
  if (systolic < 120 && diastolic < 80) return "NORMAL";
  if (systolic >= 120 && systolic < 130 && diastolic < 80) return "ELEVATED";
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return "STAGE_1";
  }
  if (systolic >= 140 || diastolic >= 90) {
    if (systolic > 180 || diastolic > 120) return "SEVERE";
    return "STAGE_2";
  }
  return "NORMAL";
};

const BP_COLORS: Record<BPStatus, { solid: string; light: string }> = {
  LOW: { solid: color.blue, light: color["light-blue"] },
  NORMAL: { solid: color.green, light: color["light-green"] },
  ELEVATED: { solid: color.yellow, light: color["light-yellow"] },
  STAGE_1: { solid: color.orange, light: color["light-orange"] },
  STAGE_2: { solid: color.red, light: color["light-red"] },
  SEVERE: { solid: color.fuschia, light: color["light-fuschia"] },
};

const LegendItem = ({ color: bg, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, { backgroundColor: bg }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const computeYAxisDomain = (values: number[]) => {
  if (values.length === 0) {
    const step = Y_AXIS_MIN_SPAN / Y_AXIS_SECTIONS;
    const min = Y_AXIS_MIN_FLOOR;
    const max = min + step * Y_AXIS_SECTIONS;
    const ticks = Array.from({ length: Y_AXIS_SECTIONS + 1 }, (_, i) => min + step * i).reverse();

    return { min, max, step, ticks };
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(1, rawMax - rawMin);
  const padding = Math.max(4, Math.round(span * Y_AXIS_PADDING_RATIO));

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

  const ticks = Array.from({ length: Y_AXIS_SECTIONS + 1 }, (_, i) => min + step * i).reverse();

  return { min, max, step, ticks };
};

export default function BloodPressureChart({ measurements }: Props) {
  const source = measurements ?? [];
  // Start collapsed so new users see 'See more' first
  const [legendCollapsed, setLegendCollapsed] = useState(true);

  const sorted = useMemo(() => {
    return [...source]
      .filter(
        (m) =>
          Number.isFinite(m.systolic_mmHg) &&
          Number.isFinite(m.diastolic_mmHg) &&
          !Number.isNaN(new Date(m.created_at).getTime()),
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }, [source]);

  const yAxisDomain = useMemo(() => {
    const values = sorted.flatMap((measurement) => [
      measurement.systolic_mmHg,
      measurement.diastolic_mmHg,
    ]);
    return computeYAxisDomain(values);
  }, [sorted]);

  const toHeight = (value: number) => {
    const ratio = clamp01(
      (value - yAxisDomain.min) / (yAxisDomain.max - yAxisDomain.min),
    );
    return Math.max(3, Math.round(ratio * PLOT_HEIGHT));
  };

  const contentWidth = Math.max(sorted.length * GROUP_PITCH, 1);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (sorted.length > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [sorted.length]);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Ionicons name="pulse" size={20} color="#111827" />
        <Text style={styles.title}>Blood Pressure</Text>
        <View style={{ width: 20 }} />
      </View>

      <LinearGradient
        colors={gradient.green as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.card}>
          <View style={styles.chartPressable}>
            {sorted.length > 0 ? (
              <View style={styles.chartRow}>
                <View style={styles.yAxis}>
                  <View style={styles.yAxisPlot}>
                    {yAxisDomain.ticks.map((tick) => (
                      <View
                        key={tick}
                        style={[styles.yAxisTick, { bottom: toHeight(tick) - 8 }]}
                      >
                        <Text style={styles.yAxisText}>{tick}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.yAxisLabelSpacer} />
                </View>

                <ScrollView
                  ref={scrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                  snapToInterval={GROUP_PITCH}
                  decelerationRate="fast"
                >
                  <View style={styles.chart}>
                    <View style={styles.gridArea}>
                      {yAxisDomain.ticks.map((tick) => (
                        <View
                          key={tick}
                          style={[styles.gridLine, { bottom: toHeight(tick) }]}
                        />
                      ))}
                    </View>

                    <View style={[styles.plotRow, { width: contentWidth }]}>
                      {sorted.map((measurement) => {
                        const status = evaluateBloodPressure(
                          measurement.systolic_mmHg,
                          measurement.diastolic_mmHg,
                        );
                        const { solid, light } = BP_COLORS[status];

                        return (
                          <View key={measurement.id} style={styles.group}>
                            <View style={styles.plotArea}>
                              <View style={styles.barPair}>
                                <View
                                  style={[
                                    styles.bar,
                                    {
                                      height: toHeight(measurement.systolic_mmHg),
                                      backgroundColor: solid,
                                    },
                                  ]}
                                />
                                <View
                                  style={[
                                    styles.bar,
                                    {
                                      height: toHeight(measurement.diastolic_mmHg),
                                      backgroundColor: light,
                                    },
                                  ]}
                                />
                              </View>
                            </View>

                            <View style={styles.labelArea}>
                              <Text style={styles.xLabel} numberOfLines={1}>
                                {formatLabelMMMdd(measurement.created_at)}{" "}
                                {formatTimehhmm(measurement.created_at)}
                              </Text>
                              <Text style={styles.measurementLabel} numberOfLines={1}>
                                {measurement.systolic_mmHg}/{measurement.diastolic_mmHg}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.noDataText}>No recorded blood pressure available. Try a wider range, or add an entry.</Text>
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
                <LegendItem color={color.fuschia} label="Severe (>180 or >120)" />
                <LegendItem color={color.red} label="Stage 2 (>=140 or >=90)" />
                <LegendItem color={color.orange} label="Stage 1 (130-139 or 80-89)" />
                <LegendItem color={color.yellow} label="Elevated" />
                <LegendItem color={color.green} label="Normal" />
                <LegendItem color={color.blue} label="Low" />

                <View style={styles.noteRow}>
                  <Text style={styles.noteText}>Darker = Systolic</Text>
                  <Text style={styles.noteText}>Lighter = Diastolic</Text>
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
    padding: 12,
  },
  chartPressable: {
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
    height: PLOT_HEIGHT,
    position: "relative",
  },
  yAxisTick: {
    position: "absolute",
    right: 0,
  },
  yAxisText: {
    fontSize: 10,
    color: "#6B7280",
  },
  yAxisLabelSpacer: {
    height: LABEL_HEIGHT,
  },
  scrollContent: {
    paddingRight: 6,
    paddingBottom: 4,
  },
  chart: {
    height: CHART_HEIGHT,
    justifyContent: "flex-end",
    position: "relative",
  },
  gridArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: PLOT_HEIGHT,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  plotRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: GROUP_GAP,
  },
  group: {
    width: GROUP_WIDTH,
    alignItems: "center",
  },
  plotArea: {
    height: PLOT_HEIGHT,
    justifyContent: "flex-end",
  },
  barPair: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-end",
  },
  bar: {
    width: 12,
    borderRadius: 6,
  },
  labelArea: {
    height: LABEL_HEIGHT,
    justifyContent: "center",
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
  emptyChart: {
    height: EMPTY_STATE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  legend: {
    marginTop: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  legendToggle: {
    marginTop: 8,
    marginBottom: -4,
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
  noteRow: {
    width: "100%",
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteText: {
    fontSize: 12,
    color: "#6B7280",
  },
});
