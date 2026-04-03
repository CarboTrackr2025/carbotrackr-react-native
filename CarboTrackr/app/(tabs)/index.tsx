import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Dimensions } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { color } from "../../shared/constants/colors";
import { Reading } from "../../shared/components/Reading";
import {
  loadAndUpdateStreak,
  getTreeStageFromStreak,
  type StreakData,
} from "../../shared/utils/streaks";

const { width } = Dimensions.get("window");

// ─── Carbohydrate logic (unchanged) ────────────────────────────────────────────
const carboGoalValue = 5000;
const carboValue = 5000; // TODO: replace with real value

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

// A fire emoji array for streak display
const flameColors = ["#FF6900", "#FDC700", "#FF6467"];

export default function Dashboard() {
  const { user } = useUser();
  const userId = user?.id;

  const remainingValue = carboGoalValue - carboValue;

  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return; // wait until Clerk has loaded the user
    setLoading(true);
    loadAndUpdateStreak(userId).then((data) => {
      setStreak(data);
      setLoading(false);
    });
  }, [userId]); // re-runs whenever the logged-in user changes

  const treeStage: TreeLevel =
    streak != null
      ? (String(getTreeStageFromStreak(streak.currentStreak)) as TreeLevel)
      : "0";

  return (
    <View style={styles.container}>
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <Text style={styles.title}>Daily Carbohydrate</Text>

      {/* ── Carbo reading ─────────────────────────────────────────────────── */}
      <Reading
        text={remainingValue.toString() + " / " + carboGoalValue.toString()}
        textStyle={styles.readingText}
        unit="g"
      />

      {/* ── Tree image ────────────────────────────────────────────────────── */}
      <Image
        source={treeImages[treeStage]}
        style={styles.tree}
        resizeMode="contain"
      />

      {/* ── Streak section ────────────────────────────────────────────────── */}
      {loading ? (
        <ActivityIndicator size="small" color={color["light-green"]} style={{ marginTop: 8 }} />
      ) : (
        <View style={styles.streakCard}>
          {/* Stage label */}
          <Text style={styles.stageLabel}>{stageLabels[treeStage]}</Text>

          {/* Row: fire + streak count + total days */}
          <View style={styles.streakRow}>
            {/* Current streak */}
            <View style={styles.streakBadge}>
              <Text style={styles.flameIcon}>🔥</Text>
              <Text style={styles.streakCount}>{streak?.currentStreak ?? 0}</Text>
              <Text style={styles.streakSubLabel}>day streak</Text>
            </View>

            <View style={styles.divider} />

            {/* Total days */}
            <View style={styles.streakBadge}>
              <Text style={styles.flameIcon}>📅</Text>
              <Text style={styles.streakCount}>{streak?.totalDays ?? 0}</Text>
              <Text style={styles.streakSubLabel}>total days</Text>
            </View>

            <View style={styles.divider} />

            {/* Longest streak */}
            <View style={styles.streakBadge}>
              <Text style={styles.flameIcon}>🏆</Text>
              <Text style={styles.streakCount}>{streak?.longestStreak ?? 0}</Text>
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
      )}
    </View>
  );
}

// ─── Helper ────────────────────────────────────────────────────────────────────
function getNextMilestone(streak: number): string {
  if (streak < 5) return `${5 - streak} more day${5 - streak !== 1 ? "s" : ""} to grow your tree 🌿`;
  if (streak < 10) return `${10 - streak} more day${10 - streak !== 1 ? "s" : ""} until your tree thrives 🌳`;
  if (streak < 15) return `${15 - streak} more day${15 - streak !== 1 ? "s" : ""} to reach ancient status 🌲`;
  return "You've reached the top! 🌴";
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 60,
    backgroundColor: "#F7FEE7",
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

  tree: {
    width: width * 0.72,
    height: width * 0.72,
  },

  // ── Streak card ──────────────────────────────────────────────────────────
  streakCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
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
  },

  streakBadge: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },

  flameIcon: {
    fontSize: 22,
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