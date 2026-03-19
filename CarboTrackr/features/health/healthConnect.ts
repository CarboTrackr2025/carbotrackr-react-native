import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
  type Permission,
} from "react-native-health-connect";

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
 * Request permissions for reading health data.
 * Must be called after ensureHealthConnectInitialized().
 */
export async function requestStepsAndHeartRatePermissions(): Promise<PermissionResult> {
  if (_permissionsInFlight) {
    hcWarn(
      "requestStepsAndHeartRatePermissions() called while a request is already in-flight; awaiting existing request",
    );
    return _permissionsInFlight;
  }

  _permissionsInFlight = (async () => {
    hcLog("requestStepsAndHeartRatePermissions() called");

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
};

export type HealthDataPayload = {
  type: "steps" | "heartRate";
  startTime: string;
  endTime: string;
  data: unknown;
};

// Placeholder for future backend sync.
// For now we just log to verify payload shape and that reads work.
export async function onHealthDataRead(payload: HealthDataPayload) {
  // TODO: send to your backend when ready (e.g. POST /health/ingest)
  // await api.post('/health/ingest', payload)
  console.log("[HealthConnect] read payload", payload.type, {
    startTime: payload.startTime,
    endTime: payload.endTime,
  });
}

async function ensurePermissionsOrThrow(permissions: Permission[]) {
  hcLog("ensurePermissionsOrThrow() ->", permissions);
  const result = await requestStepsAndHeartRatePermissions();
  hcLog("ensurePermissionsOrThrow() <-", result);
  if (!result.granted) {
    throw new Error(
      "Health Connect permission not granted. Please allow access in Health Connect and try again.",
    );
  }
}

export async function readStepsSamples(params: {
  startTime: Date;
  endTime: Date;
}): Promise<StepsSample[]> {
  hcLog("readStepsSamples()", {
    startTime: params.startTime.toISOString(),
    endTime: params.endTime.toISOString(),
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
  const { records } = await readRecords("Steps", {
    timeRangeFilter: {
      operator: "between",
      startTime: params.startTime.toISOString(),
      endTime: params.endTime.toISOString(),
    },
  });
  hcLog("readRecords('Steps') -> count", records?.length ?? 0);

  const mapped = records.map((r: any) => ({
    startTime: r.startTime,
    endTime: r.endTime,
    count: r.count,
  }));

  await onHealthDataRead({
    type: "steps",
    startTime: params.startTime.toISOString(),
    endTime: params.endTime.toISOString(),
    data: mapped,
  });

  return mapped;
}

export type HeartRateSample = {
  time: string;
  bpm: number;
};

export async function readHeartRateSamples(params: {
  startTime: Date;
  endTime: Date;
}): Promise<HeartRateSample[]> {
  hcLog("readHeartRateSamples()", {
    startTime: params.startTime.toISOString(),
    endTime: params.endTime.toISOString(),
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
  const { records } = await readRecords("HeartRate", {
    timeRangeFilter: {
      operator: "between",
      startTime: params.startTime.toISOString(),
      endTime: params.endTime.toISOString(),
    },
  });
  hcLog("readRecords('HeartRate') -> count", records?.length ?? 0);

  const mapped = records.flatMap((r: any) =>
    (r.samples ?? []).map((s: any) => ({
      time: s.time,
      bpm: s.beatsPerMinute,
    })),
  );

  await onHealthDataRead({
    type: "heartRate",
    startTime: params.startTime.toISOString(),
    endTime: params.endTime.toISOString(),
    data: mapped,
  });

  return mapped;
}
