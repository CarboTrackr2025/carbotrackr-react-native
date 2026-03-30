/**
 * healthConnect.ts
 *
 * Thin wrappers around react-native-health-connect that are used by the
 * Health screen sync flow.
 *
 * – Steps        : aggregateRecord → COUNT_TOTAL (Google Fit / Samsung Health)
 * – Calories     : aggregateRecord → ENERGY_TOTAL.inCalories (Samsung Health)
 * – Heart rate   : readRecords → most-recent sample (Samsung Health)
 */

import {
  getSdkStatus,
  initialize,
  requestPermission,
  readRecords,
  aggregateRecord,
} from "react-native-health-connect";
import { SdkAvailabilityStatus } from "react-native-health-connect";

// ─── Permission set ───────────────────────────────────────────────────────────

const PERMISSIONS = [
  { accessType: "read" as const, recordType: "HeartRate" as const },
  { accessType: "read" as const, recordType: "Steps" as const },
  { accessType: "read" as const, recordType: "TotalCaloriesBurned" as const },
];

// ─── SDK lifecycle ────────────────────────────────────────────────────────────

export type EnsureResult = {
  initialized: boolean;
  available: boolean;
  error?: string;
};

/**
 * Check SDK availability and initialise if available.
 * Safe to call multiple times – idempotent.
 */
export async function ensureHealthConnectInitialized(): Promise<EnsureResult> {
  try {
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      const msg =
        status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
          ? "Health Connect needs to be updated."
          : "Health Connect is not available on this device.";
      return { initialized: false, available: false, error: msg };
    }

    const ok = await initialize();
    if (!ok) {
      return {
        initialized: false,
        available: true,
        error: "Health Connect SDK initialisation returned false.",
      };
    }

    return { initialized: true, available: true };
  } catch (err: any) {
    return {
      initialized: false,
      available: false,
      error: err?.message ?? "Unknown error initialising Health Connect.",
    };
  }
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export type PermissionResult = {
  granted: boolean;
  grantedPermissions: string[];
};

/**
 * Request all required permissions. Returns the grant state.
 * Health Connect shows its own system dialog; if the user already
 * granted everything the dialog is skipped.
 */
export async function requestHealthDataPermissions(): Promise<PermissionResult> {
  const granted = await requestPermission(PERMISSIONS);
  const grantedTypes = granted.map((p) => p.recordType);
  return {
    granted: grantedTypes.length >= PERMISSIONS.length,
    grantedPermissions: grantedTypes,
  };
}

// ─── Steps (aggregated total) ─────────────────────────────────────────────────

export type StepsSyncResult = {
  totalSteps: number;
  dataOrigins: string[];
};

/**
 * Returns the *total* step count aggregated across the given window.
 * Uses aggregateRecord → Steps → COUNT_TOTAL so we get one consolidated
 * number instead of individual sensor segments.
 *
 * @param startTime  Window start (Date)
 * @param endTime    Window end   (Date)
 * @param preferredSources  Optional package filter (e.g. Google Fit)
 */
export async function readTotalSteps(
  startTime: Date,
  endTime: Date,
): Promise<StepsSyncResult> {
  // Do NOT filter by dataOrigin — the step total in Health Connect can come
  // from multiple sources (phone built-in, Google Fit, Samsung Health, etc.).
  // Filtering would exclude sources like the Redmi Note 13 built-in pedometer
  // and produce a lower-than-actual total.
  const result = await aggregateRecord({
    recordType: "Steps",
    timeRangeFilter: {
      operator: "between",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    },
  });

  return {
    totalSteps: (result as any).COUNT_TOTAL ?? 0,
    dataOrigins: (result as any).dataOrigins ?? [],
  };
}

// ─── Calories (aggregated total, in Calories) ─────────────────────────────────

export type CaloriesSyncResult = {
  totalCalories: number; // in Calories (not kcal)
  dataOrigins: string[];
};

/**
 * Returns the *total* calories burned (in Calories, not kcal) aggregated
 * across the given window.
 * Uses aggregateRecord → TotalCaloriesBurned → ENERGY_TOTAL.inCalories.
 *
 * @param startTime  Window start (Date)
 * @param endTime    Window end   (Date)
 * @param preferredSources  Optional package filter (e.g. Samsung Health)
 */
export async function readTotalCalories(
  startTime: Date,
  endTime: Date,
  preferredSources?: string[],
): Promise<CaloriesSyncResult> {
  const result = await aggregateRecord({
    recordType: "TotalCaloriesBurned",
    timeRangeFilter: {
      operator: "between",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    },
    ...(preferredSources?.length ? { dataOriginFilter: preferredSources } : {}),
  });

  const energyTotal = (result as any).ENERGY_TOTAL;
  return {
    // Health Connect reports "Cal" which is actually kcal (kilocalories).
    // Use inKilocalories so 1,272 Cal in HC → 1,272 stored in the DB.
    totalCalories: Math.round(energyTotal?.inKilocalories ?? 0),
    dataOrigins: (result as any).dataOrigins ?? [],
  };
}

// ─── Heart rate (most-recent sample) ─────────────────────────────────────────

export type HeartRateSyncResult = {
  bpm: number;
  time: string; // ISO timestamp of the sample
  source: string;
};

/**
 * Reads the most recent heart-rate sample from Health Connect.
 * Returns null if no data is available in the look-back window.
 *
 * Strategy: query the last 24 h with readRecords (sorted by startTime desc),
 * pick the newest interval, then take the last sample in that interval.
 *
 * @param preferredSources  Optional package filter (Samsung Health)
 */
export async function readMostRecentHeartRate(
  preferredSources?: string[],
): Promise<HeartRateSyncResult | null> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 h back

  const result = await readRecords("HeartRate", {
    timeRangeFilter: {
      operator: "between",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    },
    ...(preferredSources?.length ? { dataOriginFilter: preferredSources } : {}),
    ascendingOrder: false, // newest first
    pageSize: 10,
  });

  const records = result.records;
  if (!records || records.length === 0) return null;

  // Newest record is first (ascendingOrder: false)
  const newest = records[0];
  const samples = (newest as any).samples as Array<{
    time: string;
    beatsPerMinute: number;
  }>;

  if (!samples || samples.length === 0) return null;

  // Take the last sample within the newest interval
  const latestSample = samples[samples.length - 1];
  const source =
    (newest as any).metadata?.dataOrigin ??
    (newest as any).metadata?.sourceId ??
    "unknown";

  return {
    bpm: latestSample.beatsPerMinute,
    time: latestSample.time,
    source,
  };
}
