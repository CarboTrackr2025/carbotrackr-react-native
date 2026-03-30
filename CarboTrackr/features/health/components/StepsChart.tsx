import React, { useMemo, useRef, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { color } from "../../../shared/constants/colors";

export type StepsPoint = {
  label: string;
  value: number;
};

const PLOT_HEIGHT = 140;
const VALUE_LABEL_HEIGHT = 18;
const TIME_LABEL_HEIGHT = 24;
const CHART_HEIGHT = VALUE_LABEL_HEIGHT + PLOT_HEIGHT + TIME_LABEL_HEIGHT;

const BAR_WIDTH = 36;
const BAR_RADIUS = 8;
const GROUP_GAP = 14;

const maxOr1 = (arr: number[]) => Math.max(1, ...arr);

const formatSteps = (n: number): string => {
  if (n <= 0) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

export default function StepsChart({ points }: { points: StepsPoint[] }) {
  const scrollRef = useRef<ScrollView>(null);

  const cleaned = useMemo(
    () => (points ?? []).map((p) => ({ ...p, value: Number(p.value) || 0 })),
    [points],
  );

  const maxValue = useMemo(
    () => maxOr1(cleaned.map((p) => p.value)),
    [cleaned],
  );

  useEffect(() => {
    if (cleaned.length > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [cleaned.length]);

  const toHeight = (v: number) => {
    const t = Math.min(1, Math.max(0, v / maxValue));
    return Math.max(3, Math.round(t * PLOT_HEIGHT));
  };

  const contentWidth = Math.max(cleaned.length * (BAR_WIDTH + GROUP_GAP), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step Count Graph</Text>

      <View style={styles.card}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          snapToInterval={BAR_WIDTH + GROUP_GAP}
          decelerationRate="fast"
        >
          <View style={[styles.chart, { height: CHART_HEIGHT }]}>
            <View style={[styles.plotRow, { width: contentWidth }]}>
              {cleaned.length > 0 ? (
                cleaned.map((p, idx) => (
                  <View key={`${p.label}-${idx}`} style={styles.group}>
                    {/* Value legend above bar */}
                    <View style={styles.valueLabelArea}>
                      <Text style={styles.valueLabel} numberOfLines={1}>
                        {formatSteps(p.value)}
                      </Text>
                    </View>

                    {/* Bar */}
                    <View style={styles.plotArea}>
                      <View
                        style={[
                          styles.bar,
                          { height: toHeight(p.value) },
                        ]}
                      />
                    </View>

                    {/* Time label */}
                    <View style={styles.labelArea}>
                      <Text style={styles.xLabel} numberOfLines={1}>
                        {p.label}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noData}>
                  <Text style={styles.noDataText}>No data available</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 2, marginBottom: 8 },
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

  chart: { justifyContent: "flex-end" },
  plotRow: { flexDirection: "row", alignItems: "flex-end", gap: GROUP_GAP },

  group: { alignItems: "center", width: BAR_WIDTH },

  valueLabelArea: {
    height: VALUE_LABEL_HEIGHT,
    justifyContent: "flex-end",
    alignItems: "center",
    width: BAR_WIDTH + 6,
  },
  valueLabel: {
    fontSize: 9,
    color: "#374151",
    fontWeight: "600",
    textAlign: "center",
  },

  plotArea: { height: PLOT_HEIGHT, justifyContent: "flex-end" },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_RADIUS,
    backgroundColor: color.green,
  },

  labelArea: { height: TIME_LABEL_HEIGHT, justifyContent: "center" },
  xLabel: { fontSize: 10, color: "#6B7280", textAlign: "center" },

  noData: {
    width: 200,
    height: CHART_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: { fontSize: 14, color: "#9CA3AF", paddingVertical: 20 },
});
