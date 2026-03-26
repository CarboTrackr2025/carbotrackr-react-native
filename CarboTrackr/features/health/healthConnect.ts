import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
  type Permission,
} from "react-native-health-connect";
import { createWatchMetric } from "./api/post-watch-data";

// Enable/disable verbose Health Connect logs.
const HC_LOGS = true;
const hcLog = (...args: any[]) => {
  if (HC_LOGS) console.log("[HealthConnect]", ...args);
};
const hcWarn = (...args: any[]) => {
  if (HC_LOGS) console.warn("[HealthConnect]", ...args);
};
const hcErr = (...args: any[]) => {
  if (HC_LOGS) console.error("[HealthConnect]", ...args);
};

// Compact metric logger: prints metric type, value, origin packages, and optional note
const hcMetricLog = (
  metric: string,
  details: { value: number; unit?: string; sources?: string[]; note?: string },
) => {
  if (!HC_LOGS) return;
  const src =
    details.sources && details.sources.length > 0
      ? details.sources.join(",")
      : "unknown";
  const unit = details.unit ? ` ${details.unit}` : "";
  console.log(
    `[HealthConnect][Metric] ${metric}: ${details.value}${unit} | source: ${src}${details.note ? ` | ${details.note}` : ""}`,
  );
};

let _initialized = false;
let _initPromise: Promise<boolean> | null = null;
let _permissionsInFlight: Promise<PermissionResult> | null = null;

export type HealthConnectInitResult = {
  initialized: boolean;
  available: boolean;
  error?: string;
};

/**
 * Initialize Health Connect and check availability.
 * This should be called once at app startup or before any Health Connect operations.
 */
export async function ensureHealthConnectInitialized(): Promise<HealthConnectInitResult> {
  // Return cached result if already initialized
  if (_initialized) {
    hcLog("ensureHealthConnectInitialized() -> cached initialized=true");
    return {
      initialized: true,
      available: true,
    };
  }

  // Return existing promise if initialization is in progress
  if (_initPromise) {
    hcLog(
      "ensureHealthConnectInitialized() -> awaiting in-flight init promise",
    );
    try {
      const result = await _initPromise;
      hcLog("ensureHealthConnectInitialized() -> in-flight result", { result });
      return {
        initialized: result,
        available: result,
      };
    } catch (e: any) {
      hcErr("ensureHealthConnectInitialized() -> in-flight error", e);
      return {
        initialized: false,
        available: false,
        error: e?.message ?? String(e),
      };
    }
  }

  // Start initialization
  _initPromise = (async () => {
    try {
      hcLog("getSdkStatus()...");
      const status = await getSdkStatus();
      hcLog("getSdkStatus() ->", status);

      const available = status === SdkAvailabilityStatus.SDK_AVAILABLE;
      if (!available) {
        const msg =
          "Health Connect is not available on this device. " +
          "Please install Health Connect from the Play Store (Android 13 and below) " +
          "or ensure it's enabled in settings (Android 14+).";
        hcWarn(msg);
        throw new Error(msg);
      }

      hcLog("initialize()...");
      const initialized = await initialize();
      hcLog("initialize() ->", initialized);
      if (!initialized) {
        throw new Error("Health Connect initialize() returned false");
      }

      // Wait a brief moment to ensure native initialization is fully complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      _initialized = true;
      hcLog("Health Connect initialized successfully");
      return true;
    } catch (e: any) {
      hcErr("Health Connect init failed", e);
      _initialized = false;
      _initPromise = null; // Reset to allow retry
      throw e;
    }
  })();

  try {
    const result = await _initPromise;
    return {
      initialized: result,
      available: result,
    };
  } catch (e: any) {
    return {
      initialized: false,
      available: false,
      error: e?.message ?? String(e),
    };
  }
}

/**
 * Reset initialization state. Call this if you need to reinitialize.
 */
export function resetHealthConnectInitialization(): void {
  hcLog("resetHealthConnectInitialization()");
  _initialized = false;
  _initPromise = null;
}

type AnyGrantedPermission = {
  accessType?: string;
  recordType?: string;
};

function normalizeGrantedPermissions(granted: unknown): AnyGrantedPermission[] {
  if (!Array.isArray(granted)) return [];
  return granted
    .filter((p) => p && typeof p === "object")
    .map((p: any) => ({
      accessType: p.accessType,
      recordType: p.recordType,
    }));
}

function includesPermission(
  granted: AnyGrantedPermission[],
  needed: Permission,
): boolean {
  return granted.some(
    (p) =>
      p.accessType === needed.accessType && p.recordType === needed.recordType,
  );
}

function includesAllPermissions(
  granted: AnyGrantedPermission[],
  needed: Permission[],
): boolean {
  return needed.every((n) => includesPermission(granted, n));
}

export type PermissionResult = {
  granted: boolean;
  permissions?: Permission[];
  grantedPermissions?: AnyGrantedPermission[];
};

/**
 * Request permissions for reading health data (Steps, HeartRate, TotalCaloriesBurned).
 * Must be called after ensureHealthConnectInitialized().
 */
export async function requestHealthDataPermissions(): Promise<PermissionResult> {
  if (_permissionsInFlight) {
    hcWarn(
      "requestHealthDataPermissions() called while a request is already in-flight; awaiting existing request",
    );
    return _permissionsInFlight;
  }

  _permissionsInFlight = (async () => {
    hcLog("requestHealthDataPermissions() called");

    // Ensure initialize() was called first and wait for it to fully complete
    const initResult = await ensureHealthConnectInitialized();
    hcLog("initResult", initResult);

    if (!initResult.initialized) {
      hcErr("Health Connect not initialized", initResult);
      throw new Error(
        initResult.error ??
          "Health Connect not initialized. Call ensureHealthConnectInitialized() first.",
      );
    }

    if (!initResult.available) {
      hcErr("Health Connect not available", initResult);
      throw new Error("Health Connect is not available on this device");
    }

    const permissions: Permission[] = [
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "TotalCaloriesBurned" },
    ];

    try {
      hcLog(
        "About to call requestPermission() with:",
        JSON.stringify(permissions),
      );
      hcLog(
        "If no UI appears: permissions may already be granted, Health Connect may require screen lock, or the app may not be rebuilt after config-plugin changes.",
      );

      // Small delay to ensure native side is fully ready after initialization
      await new Promise((resolve) => setTimeout(resolve, 150));

      hcLog("Calling requestPermission() NOW...");
      const grantedRaw = await requestPermission(permissions);
      hcLog("requestPermission() returned:", JSON.stringify(grantedRaw));

      const grantedPermissions = normalizeGrantedPermissions(grantedRaw);
      const granted = includesAllPermissions(grantedPermissions, permissions);

      hcLog("requestPermission() -> computed granted?", {
        granted,
        grantedPermissions,
        requestedPermissions: permissions,
      });

      return { granted, permissions, grantedPermissions };
    } catch (e: any) {
      hcErr("requestPermission() threw", {
        message: e?.message,
        name: e?.name,
        stack: e?.stack,
      });
      return { granted: false, permissions };
    }
  })();

  try {
    return await _permissionsInFlight;
  } finally {
    _permissionsInFlight = null;
  }
}

export type StepsSample = {
  startTime: string;
  endTime: string;
  count: number;
  source?: string; // optional provider package for debugging
};

export type CaloriesBurnedSample = {
  startTime: string;
  endTime: string;
  energy: {
    inCalories: number; // we will place kcal value here for consistency
  };
  source?: string;
};

export type HealthDataPayload = {
  type: "steps" | "heartRate" | "calories";
  startTime: string;
  endTime: string;
  data: unknown;
};

export type HeartRateSample = {
  time: string;
  bpm: number;
  source?: string;
};

/**
 * Send aggregated watch metric to backend.
 * Combines steps, heart rate, and calories into a single metric entry.
 */
export async function sendWatchMetricToBackend(params: {
  profile_id: string;
  heart_rate_bpm: number;
  steps_count: number;
  calories_burned_kcal: number;
  measured_at?: string;
}) {
  try {
    // Ensure all values are proper numbers (not strings or NaN)
    const sanitizedParams = {
      profile_id: params.profile_id,
      heart_rate_bpm: Number(params.heart_rate_bpm) || 1,
      steps_count: Number(params.steps_count) || 0,
      calories_burned_kcal: Number(params.calories_burned_kcal) || 0,
      measured_at: params.measured_at,
    };

    // If measured_at provided, normalize to an unambiguous UTC ISO string
    if (sanitizedParams.measured_at) {
      try {
        const d = new Date(sanitizedParams.measured_at);
        if (!Number.isNaN(d.getTime())) {
          sanitizedParams.measured_at = d.toISOString();
        }
      } catch (e) {
        // leave original if parsing fails
      }
    }

    // Compact log before sending
    hcMetricLog("Aggregated", {
      value: sanitizedParams.steps_count,
      unit: "steps",
      sources: [],
      note: `hr=${sanitizedParams.heart_rate_bpm}, cals=${sanitizedParams.calories_burned_kcal}`,
    });

    const response = await createWatchMetric(sanitizedParams);

    // Log result concise
    hcMetricLog("SavedToBackend", {
      value: 1,
      unit: "record",
      sources: [],
      note:
        response?.status === "Success"
          ? "OK"
          : `Failed: ${response?.message ?? "unknown"}`,
    });

    return response;
  } catch (error: any) {
    hcErr(
      "sendWatchMetricToBackend() -> failed",
      error?.response?.data ?? error?.message,
    );
    hcMetricLog("SavedToBackend", {
      value: 0,
      unit: "record",
      sources: [],
      note: `Error: ${error?.message ?? "unknown"}`,
    });
    throw error;
  }
}

/**
 * Process and send health data to backend.
 * Sends each metric type independently with sensible defaults for missing fields.
 */
export async function onHealthDataRead(
  payload: HealthDataPayload,
  profile_id: string,
) {
  hcLog("[HealthConnect] read payload", payload.type, {
    startTime: payload.startTime,
    endTime: payload.endTime,
  });

  try {
    if (payload.type === "steps") {
      const stepsData = payload.data as StepsSample[];
      if ((stepsData ?? []).length === 0) return;

      // Build timeline of records with numeric counts and timestamps
      const entries = (stepsData ?? [])
        .map((s) => ({
          time: new Date(s.endTime ?? s.startTime).getTime() || 0,
          count: Number(s.count) || 0,
        }))
        .sort((a, b) => a.time - b.time);

      // Detect cumulative-record pattern: non-decreasing counts where first > 0
      let totalSteps = 0;
      const isNonDecreasing =
        entries.length >= 2 &&
        entries.every((e, i) => i === 0 || e.count >= entries[i - 1].count);
      if (isNonDecreasing && entries[0].count > 0) {
        // If the first record timestamp is at or before the requested startTime, we can safely
        // take the difference between last and first as the delta for the requested window.
        // If not (baseline missing), use the latest count as the best available total.
        const payloadStartMs = (() => {
          try {
            return new Date(payload.startTime).getTime();
          } catch (e) {
            return NaN;
          }
        })();

        const firstTime = entries[0].time;
        const lastCount = entries[entries.length - 1].count;

        if (
          !Number.isNaN(payloadStartMs) &&
          firstTime <= payloadStartMs + 1000
        ) {
          totalSteps = lastCount - entries[0].count;
        } else {
          // baseline missing; use latest observed cumulative count as best estimate
          totalSteps = lastCount;
        }

        if (totalSteps < 0) {
          // fallback to sum if something unexpected
          totalSteps = entries.reduce((sum, e) => sum + e.count, 0);
        }
      } else {
        totalSteps = entries.reduce((sum, e) => sum + e.count, 0);
      }

      if (totalSteps > 0) {
        // measured_at = latest record time
        const last = entries[entries.length - 1];
        const measuredAt = (() => {
          const d = new Date(last.time);
          return Number.isNaN(d.getTime())
            ? new Date().toISOString()
            : d.toISOString();
        })();

        // Send steps with default heart_rate_bpm=1 (minimum valid value)
        await sendWatchMetricToBackend({
          profile_id,
          heart_rate_bpm: 1, // Minimum valid value per DB constraint
          steps_count: totalSteps,
          calories_burned_kcal: 0,
          measured_at: measuredAt,
        });
      }
    } else if (payload.type === "heartRate") {
      const hrData = payload.data as HeartRateSample[];
      if (hrData.length > 0) {
        const avgBpm = Math.round(
          hrData.reduce((sum, s) => sum + s.bpm, 0) / hrData.length,
        );

        if (avgBpm > 0) {
          // Use most-recent heart-rate sample time if present
          const lastHr = hrData[hrData.length - 1];
          const measuredAtRaw =
            (lastHr && (lastHr.time ?? lastHr?.time)) ?? payload.endTime;
          const measuredAt = (() => {
            const d = new Date(measuredAtRaw as any);
            return Number.isNaN(d.getTime())
              ? new Date().toISOString()
              : d.toISOString();
          })();
          // Send heart rate with defaults for other fields
          await sendWatchMetricToBackend({
            profile_id,
            heart_rate_bpm: avgBpm,
            steps_count: 0,
            calories_burned_kcal: 0,
            measured_at: measuredAt,
          });
        }
      }
    } else if (payload.type === "calories") {
      const caloriesData = payload.data as CaloriesBurnedSample[];
      const totalCalories = caloriesData.reduce(
        (sum, c) => sum + (c.energy?.inCalories ?? 0),
        0,
      );

      if (totalCalories > 0) {
        const lastCal = caloriesData[caloriesData.length - 1];
        const measuredAtRaw = lastCal?.endTime ?? payload.endTime;
        const measuredAt = (() => {
          const d = new Date(measuredAtRaw as any);
          return Number.isNaN(d.getTime())
            ? new Date().toISOString()
            : d.toISOString();
        })();
        // Send calories with default heart_rate_bpm=1
        await sendWatchMetricToBackend({
          profile_id,
          heart_rate_bpm: 1, // Minimum valid value per DB constraint
          steps_count: 0,
          calories_burned_kcal: Math.round(totalCalories),
          measured_at: measuredAt,
        });
      }
    }
  } catch (error: any) {
    hcErr("Failed to send to backend", error);
  }
}

async function ensurePermissionsOrThrow(permissions: Permission[]) {
  hcLog("ensurePermissionsOrThrow() ->", permissions);
  const result = await requestHealthDataPermissions();
  hcLog("ensurePermissionsOrThrow() <-", result);
  if (!result.granted) {
    throw new Error(
      "Health Connect permission not granted. Please allow access in Health Connect and try again.",
    );
  }
}

// Helper to search an object recursively for a package-like string (e.g. 'com.google...')
function findPackageInObject(obj: any, depth = 3): string | null {
  if (!obj || depth <= 0) return null;
  if (typeof obj === "string") {
    if (/^com\./i.test(obj)) return obj;
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findPackageInObject(item, depth - 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      try {
        const v = (obj as any)[key];
        if (typeof v === "string" && /^com\./i.test(v)) return v;
        const found = findPackageInObject(v, depth - 1);
        if (found) return found;
      } catch (e) {
        continue;
      }
    }
  }
  return null;
}

function getRecordPackage(r: any): string | null {
  const direct =
    r?.dataOrigin?.packageName ||
    r?.dataOriginPackage ||
    r?.source?.packageName ||
    r?.origin?.packageName ||
    r?.packageName ||
    null;
  if (direct) return direct;
  // Fallback: scan object for strings that look like package names
  const scanned = findPackageInObject(r, 4);
  if (scanned) return scanned;
  return null;
}

export async function readStepsSamples(params: {
  startTime: Date;
  endTime: Date;
  profile_id?: string;
  sendToBackend?: boolean;
  preferredSources?: string[]; // optional list of package names to prefer
}): Promise<StepsSample[]> {
  hcLog("readStepsSamples()", {
    startTime: params.startTime.toISOString(),
    // make endTime inclusive by adding 1ms so records that exactly equal endTime are included
    endTime: new Date(params.endTime.getTime() + 1).toISOString(),
    preferredSources: params.preferredSources,
  });

  // Ensure initialized before reading
  const initResult = await ensureHealthConnectInitialized();
  hcLog("readStepsSamples() initResult", initResult);
  if (!initResult.initialized) {
    throw new Error("Health Connect not initialized");
  }

  await ensurePermissionsOrThrow([{ accessType: "read", recordType: "Steps" }]);

  // Small delay to ensure native side is fully ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  hcLog("readRecords('Steps')...");
  // make endTime inclusive (+1ms)
  const endTimeInclusive = new Date(params.endTime.getTime() + 1).toISOString();
  const stepsRes = await readRecords("Steps", {
    timeRangeFilter: {
      operator: "between",
      startTime: params.startTime.toISOString(),
      endTime: endTimeInclusive,
    },
  });
  let records: any[] = stepsRes.records ?? [];
  hcLog("readRecords('Steps') -> count", records?.length ?? 0);

  // Fallback: if no records were returned for the requested range, try again up to 'now'
  if (!records || records.length === 0) {
    hcWarn(
      "No Steps records in requested range; retrying with endTime=now to fetch latest available",
    );
    const nowInclusive = new Date(Date.now() + 1).toISOString();
    const retryRes = await readRecords("Steps", {
      timeRangeFilter: {
        operator: "between",
        startTime: params.startTime.toISOString(),
        endTime: nowInclusive,
      },
    });
    if ((retryRes.records ?? []).length > 0) {
      hcLog(
        "Fallback readRecords('Steps') succeeded with records up to now -> count",
        retryRes.records.length,
      );
      // prefer retry results
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      records = retryRes.records;
    } else {
      // Final fallback: try a wider window (last 7 days) ending now
      const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      hcWarn("Fallback still empty; trying a wider window (7 days)");
      const wideRes = await readRecords("Steps", {
        timeRangeFilter: {
          operator: "between",
          startTime: weekAgo,
          endTime: nowInclusive,
        },
      });
      if ((wideRes.records ?? []).length > 0) {
        hcLog(
          "Wide fallback readRecords('Steps') succeeded -> count",
          wideRes.records.length,
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // @ts-ignore
        records = wideRes.records;
      }
    }
  }

  // If caller provided preferredSources, filter records to those packages (preserve order)
  let filtered: any[] | null = null;
  if (params.preferredSources && params.preferredSources.length > 0) {
    filtered = records.filter((r: any) => {
      const pkg = getRecordPackage(r);
      return pkg && params.preferredSources!.includes(pkg);
    });
  }

  const chosenRecords = filtered && filtered.length > 0 ? filtered : records;

  // If caller requested preferredSources but none matched, emit a diagnostic of the first record shape
  if (
    params.preferredSources &&
    params.preferredSources.length > 0 &&
    (!filtered || filtered.length === 0)
  ) {
    hcWarn(
      "Preferred sources requested but none matched. First record sample:",
      records?.[0],
    );
  }

  // sort chosen records by endTime (fall back to startTime) to make latest record deterministic
  const sortByTime = (a: any, b: any) => {
    const ta = new Date(a.endTime ?? a.startTime).getTime();
    const tb = new Date(b.endTime ?? b.startTime).getTime();
    return ta - tb;
  };
  (chosenRecords ?? records).sort(sortByTime);

  const mapped = (chosenRecords ?? records).map((r: any) => {
    // Normalize start/end times to ISO with timezone if possible
    const normalizeTime = (v: any) => {
      try {
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      } catch (e) {
        // ignore
      }
      return v;
    };

    // Robustly extract a numeric step count from common fields but only accept plausible step values
    const primitiveCandidates = [r.count, r.steps, r.value];
    let count: number | null = null;
    for (const c of primitiveCandidates) {
      if (isPlausibleStepNumber(c)) {
        count = Math.round(Number(c));
        break;
      }
    }
    // fallback: search object for a plausible numeric
    if (count == null) {
      const found = safeFindStepNumber(r, 3);
      if (found != null) count = found;
    }
    if (count == null) count = 0;

    return {
      startTime: normalizeTime(r.startTime),
      endTime: normalizeTime(r.endTime),
      count: Number(count) || 0,
      source: getRecordPackage(r) ?? undefined,
    };
  });

  // Emit concise metric log with total and sources used
  try {
    const totalSteps = mapped.reduce(
      (s: number, m: any) => s + (m.count ?? 0),
      0,
    );
    const usedSources = Array.from(
      new Set(
        (chosenRecords ?? records)
          .map((r: any) => getRecordPackage(r))
          .filter(Boolean) as string[],
      ),
    );
    hcMetricLog("Steps", {
      value: totalSteps,
      unit: "steps",
      sources: usedSources,
    });
  } catch (e) {
    // ignore logging errors
  }

  // Only call onHealthDataRead when caller explicitly requests it
  if (params.sendToBackend && params.profile_id) {
    await onHealthDataRead(
      {
        type: "steps",
        startTime: params.startTime.toISOString(),
        endTime: new Date(params.endTime.getTime() + 1).toISOString(),
        data: mapped,
      },
      params.profile_id,
    );
  }

  return mapped;
}

export async function readHeartRateSamples(params: {
  startTime: Date;
  endTime: Date;
  profile_id?: string;
  sendToBackend?: boolean;
  preferredSources?: string[];
}): Promise<HeartRateSample[]> {
  hcLog("readHeartRateSamples()", {
    startTime: params.startTime.toISOString(),
    endTime: new Date(params.endTime.getTime() + 1).toISOString(),
    preferredSources: params.preferredSources,
  });

  // Ensure initialized before reading
  const initResult = await ensureHealthConnectInitialized();
  hcLog("readHeartRateSamples() initResult", initResult);
  if (!initResult.initialized) {
    throw new Error("Health Connect not initialized");
  }

  await ensurePermissionsOrThrow([
    { accessType: "read", recordType: "HeartRate" },
  ]);

  // Small delay to ensure native side is fully ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  hcLog("readRecords('HeartRate')...");
  const endTimeInclusive = new Date(params.endTime.getTime() + 1).toISOString();
  const hrRes = await readRecords("HeartRate", {
    timeRangeFilter: {
      operator: "between",
      startTime: params.startTime.toISOString(),
      endTime: endTimeInclusive,
    },
  });
  let records: any[] = hrRes.records ?? [];
  hcLog("readRecords('HeartRate') -> count", records?.length ?? 0);

  // Fallback: if no heart-rate records in requested range, retry up to now and then wider window
  if (!records || records.length === 0) {
    hcWarn(
      "No HeartRate records in requested range; retrying with endTime=now to fetch latest available",
    );
    const nowInclusive = new Date(Date.now() + 1).toISOString();
    const retryRes = await readRecords("HeartRate", {
      timeRangeFilter: {
        operator: "between",
        startTime: params.startTime.toISOString(),
        endTime: nowInclusive,
      },
    });
    if ((retryRes.records ?? []).length > 0) {
      hcLog(
        "Fallback readRecords('HeartRate') succeeded with records up to now -> count",
        retryRes.records.length,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      records = retryRes.records;
    } else {
      const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      hcWarn(
        "Fallback still empty for HeartRate; trying a wider window (7 days)",
      );
      const wideRes = await readRecords("HeartRate", {
        timeRangeFilter: {
          operator: "between",
          startTime: weekAgo,
          endTime: nowInclusive,
        },
      });
      if ((wideRes.records ?? []).length > 0) {
        hcLog(
          "Wide fallback readRecords('HeartRate') succeeded -> count",
          wideRes.records.length,
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // @ts-ignore
        records = wideRes.records;
      }
    }
  }

  // prepare chosenRecords for heart rate as well
  let filtered: any[] | null = null;
  if (params.preferredSources && params.preferredSources.length > 0) {
    filtered = records.filter((r: any) => {
      const pkg = getRecordPackage(r);
      return pkg && params.preferredSources!.includes(pkg);
    });
  }
  const chosenRecords = filtered && filtered.length > 0 ? filtered : records;

  const mapped = (chosenRecords ?? records).flatMap((r: any) =>
    (r.samples ?? []).map((s: any) => {
      const timeRaw = s?.time ?? s?.startTime ?? r?.startTime;
      const time = (() => {
        try {
          const d = new Date(timeRaw);
          if (!Number.isNaN(d.getTime())) return d.toISOString();
        } catch (e) {
          // fallthrough
        }
        return timeRaw;
      })();

      const bpm = (() => {
        if (s == null) return 0;
        if (s.beatsPerMinute != null) return Number(s.beatsPerMinute) || 0;
        if (s.bpm != null) return Number(s.bpm) || 0;
        // fallback: attempt to parse value from object fields
        for (const k of Object.keys(s)) {
          const v = (s as any)[k];
          const n = Number(v);
          if (!Number.isNaN(n)) return n;
        }
        return 0;
      })();

      return {
        time,
        bpm: Number(bpm) || 0,
        source: getRecordPackage(r) ?? undefined,
      };
    }),
  );

  // sort mapped heart-rate samples by time so latest sample is deterministic
  mapped.sort(
    (a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  // Emit concise metric log with average bpm and sources used
  try {
    const avgBpm =
      mapped.length > 0
        ? Math.round(
            mapped.reduce((acc: number, m: any) => acc + (m.bpm ?? 0), 0) /
              mapped.length,
          )
        : 0;
    const usedSources = Array.from(
      new Set(
        (chosenRecords ?? records)
          .map((r: any) => getRecordPackage(r))
          .filter(Boolean) as string[],
      ),
    );
    hcMetricLog("HeartRate", {
      value: avgBpm,
      unit: "bpm",
      sources: usedSources,
    });
  } catch (e) {
    // ignore logging errors
  }

  // Only call onHealthDataRead when caller explicitly requests it
  if (params.sendToBackend && params.profile_id) {
    await onHealthDataRead(
      {
        type: "heartRate",
        startTime: params.startTime.toISOString(),
        endTime: new Date(params.endTime.getTime() + 1).toISOString(),
        data: mapped,
      },
      params.profile_id,
    );
  }

  return mapped;
}

export async function readTotalCaloriesBurned(params: {
  startTime: Date;
  endTime: Date;
  profile_id?: string;
  sendToBackend?: boolean;
  preferredSources?: string[];
}): Promise<CaloriesBurnedSample[]> {
  hcLog("readTotalCaloriesBurned()", {
    startTime: params.startTime.toISOString(),
    endTime: new Date(params.endTime.getTime() + 1).toISOString(),
    preferredSources: params.preferredSources,
  });

  // Ensure initialized before reading
  const initResult = await ensureHealthConnectInitialized();
  hcLog("readTotalCaloriesBurned() initResult", initResult);
  if (!initResult.initialized) {
    throw new Error("Health Connect not initialized");
  }

  await ensurePermissionsOrThrow([
    { accessType: "read", recordType: "TotalCaloriesBurned" },
  ]);

  // Small delay to ensure native side is fully ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  hcLog("readRecords('TotalCaloriesBurned')...");
  const endTimeInclusive = new Date(params.endTime.getTime() + 1).toISOString();
  const calRes = await readRecords("TotalCaloriesBurned", {
    timeRangeFilter: {
      operator: "between",
      startTime: params.startTime.toISOString(),
      endTime: endTimeInclusive,
    },
  });
  let records: any[] = calRes.records ?? [];
  hcLog("readRecords('TotalCaloriesBurned') -> count", records?.length ?? 0);

  // Fallback: if no calorie records in requested range, retry up to now and then wider window
  if (!records || records.length === 0) {
    hcWarn(
      "No Calories records in requested range; retrying with endTime=now to fetch latest available",
    );
    const nowInclusive = new Date(Date.now() + 1).toISOString();
    const retryRes = await readRecords("TotalCaloriesBurned", {
      timeRangeFilter: {
        operator: "between",
        startTime: params.startTime.toISOString(),
        endTime: nowInclusive,
      },
    });
    if ((retryRes.records ?? []).length > 0) {
      hcLog(
        "Fallback readRecords('TotalCaloriesBurned') succeeded with records up to now -> count",
        retryRes.records.length,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      records = retryRes.records;
    } else {
      const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      hcWarn(
        "Fallback still empty for Calories; trying a wider window (7 days)",
      );
      const wideRes = await readRecords("TotalCaloriesBurned", {
        timeRangeFilter: {
          operator: "between",
          startTime: weekAgo,
          endTime: nowInclusive,
        },
      });
      if ((wideRes.records ?? []).length > 0) {
        hcLog(
          "Wide fallback readRecords('TotalCaloriesBurned') succeeded -> count",
          wideRes.records.length,
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // @ts-ignore
        records = wideRes.records;
      }
    }
  }

  // prepare chosenRecords for calories as well
  let filtered: any[] | null = null;
  if (params.preferredSources && params.preferredSources.length > 0) {
    filtered = records.filter((r: any) => {
      const pkg = getRecordPackage(r);
      return pkg && params.preferredSources!.includes(pkg);
    });
  }
  const chosenRecords = filtered && filtered.length > 0 ? filtered : records;

  const mapped = (chosenRecords ?? records).map((r: any) => {
    // Try to extract calorie value from common fields; normalized to kcal
    let kcal: number | null = null;
    try {
      if (r?.energy?.inKilocalories != null)
        kcal = Number(r.energy.inKilocalories);
      else if (r?.energy?.inCalories != null) {
        const v = Number(r.energy.inCalories);
        if (!Number.isNaN(v)) kcal = v;
      } else if (r?.calories != null) {
        kcal = Number(r.calories);
      } else if (r?.value != null) {
        kcal = Number(r.value);
      } else {
        // fallback: try to find a numeric anywhere in the record
        const found = findNumericInObject(r, 4);
        if (found != null) kcal = Number(found);
      }

      // Heuristic: if value looks like joules (very large), convert to kcal
      if (kcal != null && !Number.isNaN(kcal) && kcal > 10000) {
        kcal = Math.round(kcal / 4184);
      }
    } catch (e) {
      kcal = null;
    }

    if (kcal == null || Number.isNaN(kcal)) kcal = 0;

    const normalizeTime = (v: any) => {
      try {
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      } catch (e) {
        // ignore
      }
      return v;
    };

    return {
      startTime: normalizeTime(r.startTime),
      endTime: normalizeTime(r.endTime),
      energy: { inCalories: Math.round(kcal) },
      source: getRecordPackage(r) ?? undefined,
    };
  });

  // Emit concise metric log with total calories and sources used
  try {
    const totalCalories = Math.round(
      mapped.reduce(
        (sum: number, c: any) => sum + (c.energy?.inCalories ?? 0),
        0,
      ),
    );
    const usedSources = Array.from(
      new Set(
        (chosenRecords ?? records)
          .map((r: any) => getRecordPackage(r))
          .filter(Boolean) as string[],
      ),
    );
    hcMetricLog("Calories", {
      value: totalCalories,
      unit: "kcal",
      sources: usedSources,
    });
  } catch (e) {
    // ignore logging errors
  }

  // Only call onHealthDataRead when caller explicitly requests it
  if (params.sendToBackend && params.profile_id) {
    await onHealthDataRead(
      {
        type: "calories",
        startTime: params.startTime.toISOString(),
        endTime: new Date(params.endTime.getTime() + 1).toISOString(),
        data: mapped,
      },
      params.profile_id,
    );
  }

  return mapped;
}

// Helper to find the first numeric value in an object (shallow recursive, limited depth)
function findNumericInObject(obj: any, depth = 3): number | null {
  if (obj == null || depth <= 0) return null;
  if (typeof obj === "number" && !Number.isNaN(obj)) return obj;
  if (typeof obj === "string") {
    const n = Number(obj);
    if (!Number.isNaN(n)) return n;
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findNumericInObject(item, depth - 1);
      if (found != null) return found;
    }
    return null;
  }
  if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      try {
        const v = (obj as any)[key];
        const found = findNumericInObject(v, depth - 1);
        if (found != null) return found;
      } catch (e) {
        continue;
      }
    }
  }
  return null;
}

// Safe numeric finder that only returns numbers within a plausible range for steps.
function safeFindStepNumber(
  obj: any,
  depth = 3,
  min = 0,
  max = 100000,
): number | null {
  const n = findNumericInObject(obj, depth);
  if (n == null || Number.isNaN(n)) return null;
  // Reject values that look like timestamps in milliseconds/seconds
  if (n > 1e10 || n < -1e10) return null;
  if (n >= min && n <= max) return Math.round(n);
  return null;
}

// Quick plausibility check for step-like numbers (used for primitive fields)
function isPlausibleStepNumber(n: any, min = 0, max = 100000): boolean {
  if (n == null) return false;
  const num = Number(n);
  if (Number.isNaN(num)) return false;
  if (num > 1e10 || num < -1e10) return false;
  return num >= min && num <= max;
}

/**
 * Debug helper: read and return raw Health Connect records for specified types.
 * Use this from a temporary debug UI or console to inspect exact record shapes,
 * packages, timestamps and units from Health Connect on the device.
 */
export async function debugDumpHealthConnectRecords(params: {
  startTime: Date;
  endTime: Date;
  limitPerType?: number;
}) {
  const limit = params.limitPerType ?? 10;
  await ensureHealthConnectInitialized();
  await ensurePermissionsOrThrow([
    { accessType: "read", recordType: "Steps" },
    { accessType: "read", recordType: "HeartRate" },
    { accessType: "read", recordType: "TotalCaloriesBurned" },
  ]);

  const timeRange = {
    operator: "between",
    startTime: params.startTime.toISOString(),
    endTime: params.endTime.toISOString(),
  } as any;

  const out: any = { steps: [], heartRate: [], calories: [] };

  try {
    hcLog("[Debug] readRecords Steps", timeRange);
    const stepsRes = await readRecords("Steps", { timeRangeFilter: timeRange });
    hcLog("[Debug] Steps count:", stepsRes.records?.length ?? 0);
    out.steps = (stepsRes.records ?? []).slice(0, limit).map((r: any) => ({
      package: getRecordPackage(r),
      startTime: r.startTime,
      endTime: r.endTime,
      count: r.count,
      raw: r,
    }));

    hcLog("[Debug] readRecords HeartRate", timeRange);
    const hrRes = await readRecords("HeartRate", {
      timeRangeFilter: timeRange,
    });
    hcLog("[Debug] HeartRate records:", hrRes.records?.length ?? 0);
    out.heartRate = (hrRes.records ?? []).slice(0, limit).map((r: any) => ({
      package: getRecordPackage(r),
      recordStart: r.startTime,
      recordEnd: r.endTime,
      samplesCount: (r.samples ?? []).length,
      // include first 5 samples shallowly
      samples: (r.samples ?? []).slice(0, 5).map((s: any) => ({
        time: s.time ?? s.startTime,
        beatsPerMinute: s.beatsPerMinute ?? s.bpm ?? findNumericInObject(s, 2),
      })),
      raw: r,
    }));

    hcLog("[Debug] readRecords TotalCaloriesBurned", timeRange);
    const calRes = await readRecords("TotalCaloriesBurned", {
      timeRangeFilter: timeRange,
    });
    hcLog("[Debug] Calories records:", calRes.records?.length ?? 0);
    out.calories = (calRes.records ?? []).slice(0, limit).map((r: any) => ({
      package: getRecordPackage(r),
      startTime: r.startTime,
      endTime: r.endTime,
      // common fields to inspect
      energy: r.energy ?? r.calories ?? r.value ?? null,
      raw: r,
    }));

    hcLog("[Debug] Dump prepared", {
      steps: out.steps.length,
      heartRate: out.heartRate.length,
      calories: out.calories.length,
    });
    return out;
  } catch (e: any) {
    hcErr("[Debug] debugDumpHealthConnectRecords error", e);
    throw e;
  }
}
