import React, { useMemo, useRef, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { color } from "../../../shared/constants/colors";

type GlucoseMeasurement = {
  id: string;
  level: number;
  created_at: string;
};

type Props = {
  measurements?: GlucoseMeasurement[];
};

type GlucoseStatus = "LOW" | "NORMAL" | "ELEVATED" | "HIGH" | "VERY_HIGH";

const formatLabelMMMdd = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    .replace(" ", "-");
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const evaluateBloodGlucose = (level: number): GlucoseStatus => {
  if (level < 70) return "LOW";
  if (level <= 99) return "NORMAL";
  if (level <= 125) return "ELEVATED";
  if (level <= 199) return "HIGH";
  return "VERY_HIGH";
};

const GLUCOSE_COLORS: Record<GlucoseStatus, string> = {
  LOW: color.blue,
  NORMAL: color.green,
  ELEVATED: color.yellow,
  HIGH: color.red,
  VERY_HIGH: color.red,
};

const PLOT_HEIGHT = 140;
const LABEL_HEIGHT = 24;
const CHART_HEIGHT = PLOT_HEIGHT + LABEL_HEIGHT;

const Y_MIN = 0;
const Y_MAX = 300;

const BAR_WIDTH = 28;
const GROUP_GAP = 14;
const GROUP_PITCH = BAR_WIDTH + GROUP_GAP;

export default function BloodGlucoseChart({ measurements }: Props) {
  const source = measurements ?? [];

  const sorted = useMemo(() => {
    return [...source]
      .filter(
        (m) =>
          Number.isFinite(m.level) &&
          !Number.isNaN(new Date(m.created_at).getTime()),
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }, [source]);

  const toHeight = (v: number) => {
    const t = clamp01((v - Y_MIN) / (Y_MAX - Y_MIN));
    return Math.max(3, Math.round(t * PLOT_HEIGHT));
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
      <Text style={styles.title}>Blood Glucose</Text>

      <View style={styles.card}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          snapToInterval={GROUP_PITCH}
          decelerationRate="fast"
        >
          <View style={styles.chart}>
            <View style={[styles.plotRow, { width: contentWidth }]}>
              {sorted.map((m) => {
                const status = evaluateBloodGlucose(m.level);
                const barColor = GLUCOSE_COLORS[status];

                return (
                  <View key={m.id} style={styles.group}>
                    <View style={styles.plotArea}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: toHeight(m.level),
                            backgroundColor: barColor,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.labelArea}>
                      <Text style={styles.xLabel} numberOfLines={1}>
                        {formatLabelMMMdd(m.created_at)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
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
  chart: { height: CHART_HEIGHT, justifyContent: "flex-end" },
  plotRow: { flexDirection: "row", alignItems: "flex-end", gap: GROUP_GAP },
  group: { width: BAR_WIDTH, alignItems: "center" },
  plotArea: { height: PLOT_HEIGHT, justifyContent: "flex-end" },
  bar: { width: BAR_WIDTH, borderRadius: 6 },
  labelArea: { height: LABEL_HEIGHT, justifyContent: "center" },
  xLabel: { fontSize: 10, color: "#6B7280", textAlign: "center" },
  legend: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 12, color: color.black },
});
