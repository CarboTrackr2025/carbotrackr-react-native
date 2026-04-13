import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-gifted-charts";
import { color, gradient } from "../../shared/constants/colors";
import {
  loadAndUpdateStreak,
  getTreeStageFromStreak,
  type StreakData,
} from "../../shared/utils/streaks";
import { getDashboardCarbohydrateGoal } from "../../features/dashboard/api/get-carbohydrate-goal";

const { width } = Dimensions.get("window");

type TreeLevel = "0" | "1" | "2" | "3" | "4";

const treeImages: Record<TreeLevel, any> = {
  "0": require("../../assets/stage0.png"),
  "1": require("../../assets/stage1.png"),
  "2": require("../../assets/stage2.png"),
  "3": require("../../assets/stage3.png"),
  "4": require("../../assets/stage4.png"),
};

// ─── Streak badge labels ────────────────────────────────────────────────────────
const stageLabels: Record<TreeLevel, string> = {
  "0": "Just planted 🌱",
  "1": "Sprouting 🌿",
  "2": "Growing 🌳",
  "3": "Thriving 🌲",
  "4": "Ancient Tree 🌴",
};

export default function Dashboard() {
  const { userId } = useAuth();

  const [streak, setStreak] = useState<StreakData | null>(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [carbohydrateGoal, setCarbohydrateGoal] = useState(0);
  const [currentCarbohydrates, setCurrentCarbohydrates] = useState(0);
  const [carbohydrateLoading, setCarbohydrateLoading] = useState(true);

  const remainingValue = Math.max(carbohydrateGoal - currentCarbohydrates, 0);

  const fetchStreak = useCallback(async () => {
    if (!userId) return;

    setStreakLoading(true);
    const data = await loadAndUpdateStreak(userId);
    setStreak(data);
    setStreakLoading(false);
  }, [userId]);

  const fetchCarbohydrateGoal = useCallback(async () => {
    if (!userId) return;

    try {
      setCarbohydrateLoading(true);
      const result = await getDashboardCarbohydrateGoal(userId);
      setCarbohydrateGoal(result.dailyCarbohydrateGoalG);
      setCurrentCarbohydrates(result.currentCarbohydratesG);
    } catch {
      setCarbohydrateGoal(0);
      setCurrentCarbohydrates(0);
    } finally {
      setCarbohydrateLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      fetchStreak();
      fetchCarbohydrateGoal();
    }, [fetchCarbohydrateGoal, fetchStreak, userId]),
  );

  const treeStage: TreeLevel =
    streak != null
      ? (String(getTreeStageFromStreak(streak.currentStreak)) as TreeLevel)
      : "0";

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <Text style={styles.title}>Daily Carbohydrate</Text>

      {/* ── Carbo reading ─────────────────────────────────────────────────── */}
      {carbohydrateLoading ? (
        <ActivityIndicator
          size="small"
          color={color["light-green"]}
          style={{ marginTop: 8 }}
        />
      ) : (
        <View style={styles.chartContainer}>
          <PieChart
            data={[
              {
                value: currentCarbohydrates,
                color: gradient.green[1],
                text: `${Math.round(
                  (currentCarbohydrates / carbohydrateGoal) * 100,
                )}%`,
              },
              {
                value: remainingValue,
                color: "#E5E7EB",
              },
            ]}
            radius={70}
            innerRadius={50}
            centerLabelComponent={() => (
              <View style={styles.centerLabel}>
                <Text style={styles.centerLabelValue}>
                  {remainingValue.toFixed(1)}
                </Text>
                <Text style={styles.centerLabelUnit}>g left</Text>
              </View>
            )}
          />
          <View style={styles.chartLegend}>
            <Text style={styles.chartLegendText}>
              {currentCarbohydrates.toFixed(1)} / {carbohydrateGoal.toFixed(1)}g
            </Text>
          </View>
        </View>
      )}

      {/* ── Tree image ────────────────────────────────────────────────────── */}
      <Image
        source={treeImages[treeStage]}
        style={styles.tree}
        resizeMode="contain"
      />

      {/* ── Streak section ────────────────────────────────────────────────── */}
      {streakLoading ? (
        <ActivityIndicator
          size="small"
          color={color["light-green"]}
          style={{ marginTop: 8 }}
        />
      ) : (
        <LinearGradient
          colors={gradient.green as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCardBorder}
        >
          <View style={styles.streakCard}>
          {/* Stage label */}
          <Text style={styles.stageLabel}>{stageLabels[treeStage]}</Text>

          {/* Row: fire + streak count + total days */}
          <View style={styles.streakRow}>
            {/* Current streak */}
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={24} style={styles.flameIcon} />
              <Text style={styles.streakCount}>
                {streak?.currentStreak ?? 0}
              </Text>
              <Text style={styles.streakSubLabel}>day streak</Text>
            </View>

            <View style={styles.divider} />

            {/* Total days */}
            <View style={styles.streakBadge}>
              <Ionicons name="calendar" size={24} style={styles.flameIcon} />
              <Text style={styles.streakCount}>{streak?.totalDays ?? 0}</Text>
              <Text style={styles.streakSubLabel}>total days</Text>
            </View>

            <View style={styles.divider} />

            {/* Longest streak */}
            <View style={styles.streakBadge}>
              <Ionicons name="trophy" size={24} style={styles.flameIcon} />
              <Text style={styles.streakCount}>
                {streak?.longestStreak ?? 0}
              </Text>
              <Text style={styles.streakSubLabel}>best streak</Text>
            </View>
          </View>

          {/* Progress hint */}
          {treeStage !== "4" && (
            <Text style={styles.progressHint}>
              {getNextMilestone(streak?.currentStreak ?? 0)}
            </Text>
          )}
          </View>
        </LinearGradient>
      )}
    </View>
    </SafeAreaView>
  );
}

// ─── Helper ────────────────────────────────────────────────────────────────────
function getNextMilestone(streak: number): string {
  if (streak < 5)
    return `${5 - streak} more day${5 - streak !== 1 ? "s" : ""} to grow your tree 🌿`;
  if (streak < 10)
    return `${10 - streak} more day${10 - streak !== 1 ? "s" : ""} until your tree thrives 🌳`;
  if (streak < 15)
    return `${15 - streak} more day${15 - streak !== 1 ? "s" : ""} to reach ancient status 🌲`;
  return "You've reached the top! 🌴";
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: color.white,
  },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 0,
    backgroundColor: color.white,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: color["green"],
    letterSpacing: 0.4,
    textAlign: "center",
  },

  readingText: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
  },

  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },

  centerLabel: {
    alignItems: "center",
    justifyContent: "center",
  },

  centerLabelValue: {
    fontSize: 24,
    fontWeight: "700",
    color: gradient.green[1],
  },

  centerLabelUnit: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  chartLegend: {
    marginTop: 12,
    alignItems: "center",
  },

  chartLegendText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  tree: {
    width: width * 0.5,
    height: width * 0.5,
  },

  // ── Streak card ──────────────────────────────────────────────────────────
  streakCardBorder: {
    width: "100%",
    borderRadius: 22,
    padding: 2.5,
    marginBottom: -30,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  streakCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
  },

  stageLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: color["green"],
    marginBottom: 2,
  },

  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 10,
  },

  streakBadge: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },

  flameIcon: {
    color: color["green"],
  },

  streakCount: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 30,
  },

  streakSubLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  divider: {
    width: 1,
    height: 48,
    backgroundColor: "#E5E7EB",
  },

  progressHint: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 4,
  },
});
