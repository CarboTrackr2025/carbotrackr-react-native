import AsyncStorage from "@react-native-async-storage/async-storage";

const streakKey = (userId: string) => `carbotrackr_streak_${userId}`;

export type StreakData = {
  currentStreak: number;   // consecutive days
  totalDays: number;       // all-time login days
  lastLoginDate: string;   // ISO date string YYYY-MM-DD
  longestStreak: number;
};

const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const diffInDays = (a: string, b: string) => {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round((msB - msA) / (1000 * 60 * 60 * 24));
};

export const loadAndUpdateStreak = async (userId: string): Promise<StreakData> => {
  const today = todayStr();
  const KEY = streakKey(userId);

  try {
    const raw = await AsyncStorage.getItem(KEY);

    if (!raw) {
      // First ever open for this account
      const initial: StreakData = {
        currentStreak: 1,
        totalDays: 1,
        lastLoginDate: today,
        longestStreak: 1,
      };
      await AsyncStorage.setItem(KEY, JSON.stringify(initial));
      return initial;
    }

    const data: StreakData = JSON.parse(raw);

    // Already logged in today — return as-is
    if (data.lastLoginDate === today) {
      return data;
    }

    const daysSinceLast = diffInDays(data.lastLoginDate, today);

    let currentStreak: number;
    if (daysSinceLast === 1) {
      // Consecutive day
      currentStreak = data.currentStreak + 1;
    } else {
      // Streak broken
      currentStreak = 1;
    }

    const updated: StreakData = {
      currentStreak,
      totalDays: data.totalDays + 1,
      lastLoginDate: today,
      longestStreak: Math.max(data.longestStreak, currentStreak),
    };

    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
  } catch {
    // Fallback on error
    const fallback: StreakData = {
      currentStreak: 1,
      totalDays: 1,
      lastLoginDate: today,
      longestStreak: 1,
    };
    return fallback;
  }
};

/**
 * Determines tree stage (0-4) based on streak days:
 *  0 days  → stage0 (sapling / dead)
 *  1-4     → stage1
 *  5-9     → stage2
 *  10-14   → stage3
 *  15+     → stage4
 */
export const getTreeStageFromStreak = (streak: number): 0 | 1 | 2 | 3 | 4 => {
  if (streak <= 0) return 0;
  if (streak < 5) return 1;
  if (streak < 10) return 2;
  if (streak < 15) return 3;
  return 4;
};
