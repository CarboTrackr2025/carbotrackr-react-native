import React, { useMemo, useRef, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { color, gradient } from "../../../shared/constants/colors";

export type StepsPoint = {
  label: string;
  value: number;
};

const PLOT_HEIGHT = 140;
const VALUE_LABEL_HEIGHT = 18;
const TIME_LABEL_HEIGHT = 34;
const CHART_HEIGHT = VALUE_LABEL_HEIGHT + PLOT_HEIGHT + TIME_LABEL_HEIGHT;

const BAR_WIDTH = 56;
const BAR_RADIUS = 8;
const GROUP_GAP = 14;

const maxOr1 = (arr: number[]) => Math.max(1, ...arr);

const formatSteps = (n: number): string => {
  if (n <= 0) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

export default function StepsChart({
  points,
  error,
}: {
  points: StepsPoint[];
  error?: string | null;
}) {
  const scrollRef = useRef<ScrollView>(null);

  const cleaned = useMemo(() => {
    const data =
      Array.isArray(points) && points.length > 0
        ? points.map((p) => ({ ...p, value: Number(p.value) || 0 }))
        : [];
    return data;
  }, [points]);

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
      <View style={styles.titleContainer}>
        <Ionicons name="footsteps" size={20} color="#111827" />
        <Text style={styles.title}>Step Count</Text>
        <View style={{ width: 20 }} />
      </View>

      <LinearGradient
        colors={gradient.green as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.card}>
          {cleaned.length > 0 ? (
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
                  {cleaned.map((p, idx) => (
                    <View key={`${p.label}-${idx}`} style={styles.group}>
                      <View style={styles.valueLabelArea}>
                        <Text style={styles.valueLabel} numberOfLines={1}>
                          {formatSteps(p.value)}
                        </Text>
                      </View>

                      <View style={styles.plotArea}>
                        <View
                          style={[styles.bar, { height: toHeight(p.value) }]}
                        />
                      </View>

                      <View style={styles.labelArea}>
                        <Text style={styles.xLabel} numberOfLines={1}>
                          {p.label}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.noDataText}>
                {error ??
                  "No recorded step count available. Try a wider range, or sync metrics."}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 2, marginBottom: 8 },
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
  xLabel: {
    fontSize: 9,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 11,
  },

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
