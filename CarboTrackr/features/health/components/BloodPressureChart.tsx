import React, { useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, gradient } from "../../../shared/constants/colors";

type BpMeasurement = {
  id: string;
  systolic_mmHg: number;
  diastolic_mmHg: number;
  created_at: string;
};

type Props = {
  measurements?: BpMeasurement[];
};

type BPStatus = "LOW" | "NORMAL" | "ELEVATED" | "HYPERTENSION" | "CRISIS";

const PLOT_HEIGHT = 140;
const LABEL_HEIGHT = 42;
const CHART_HEIGHT = PLOT_HEIGHT + LABEL_HEIGHT;

const Y_MIN = 20;
const Y_MAX = 200;
const Y_TICKS = [200, 160, 120, 80, 40, 20];

const GROUP_WIDTH = 64;
const GROUP_GAP = 14;
const GROUP_PITCH = GROUP_WIDTH + GROUP_GAP;
const Y_AXIS_WIDTH = 34;
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

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const evaluateBloodPressure = (systolic: number, diastolic: number): BPStatus => {
  if (systolic < 90 || diastolic < 60) return "LOW";
  if (systolic < 120 && diastolic < 80) return "NORMAL";
  if (systolic >= 120 && systolic < 130 && diastolic < 80) return "ELEVATED";
  if ((systolic >= 130 && systolic < 180) || (diastolic >= 80 && diastolic < 120)) {
    return "HYPERTENSION";
  }
  if (systolic >= 180 || diastolic >= 120) return "CRISIS";
  return "NORMAL";
};

const BP_COLORS: Record<BPStatus, { solid: string; light: string }> = {
  LOW: { solid: color.blue, light: color["light-blue"] },
  NORMAL: { solid: color.green, light: color["light-green"] },
  ELEVATED: { solid: color.yellow, light: color["light-yellow"] },
  HYPERTENSION: { solid: color.red, light: color["light-red"] },
  CRISIS: { solid: color.red, light: color["light-red"] },
};

const LegendItem = ({ color: bg, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendSwatch, { backgroundColor: bg }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

export default function BloodPressureChart({ measurements }: Props) {
  const source = measurements ?? [];

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

  const toHeight = (value: number) => {
    const ratio = clamp01((value - Y_MIN) / (Y_MAX - Y_MIN));
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
      <Text style={styles.title}>Blood Pressure</Text>

      <LinearGradient
        colors={gradient.green as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.card}>
        <View style={styles.chartRow}>
          <View style={styles.yAxis}>
            <View style={styles.yAxisPlot}>
              {Y_TICKS.map((tick) => (
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
                {Y_TICKS.map((tick) => (
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

        <View style={styles.legend}>
          <LegendItem color={color.red} label="Hypertension / Crisis" />
          <LegendItem color={color.yellow} label="Elevated" />
          <LegendItem color={color.green} label="Normal" />
          <LegendItem color={color.blue} label="Low" />

          <View style={styles.noteRow}>
            <Text style={styles.noteText}>Darker = Systolic</Text>
            <Text style={styles.noteText}>Lighter = Diastolic</Text>
          </View>
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
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  yAxis: {
    width: Y_AXIS_WIDTH,
    marginRight: 8,
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
  legend: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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
