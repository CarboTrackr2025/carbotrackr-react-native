import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
  type Permission,
} from "react-native-health-connect";

let _initialized = false;
let _initPromise: Promise<boolean> | null = null;

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
    return {
      initialized: true,
      available: true,
    };
  }

  // Return existing promise if initialization is in progress
  if (_initPromise) {
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

  // Start initialization
  _initPromise = (async () => {
    try {
      // Check if Health Connect is available on this device
      const status = await getSdkStatus();
      const available = status === SdkAvailabilityStatus.SDK_AVAILABLE;
      if (!available) {
        throw new Error(
          "Health Connect is not available on this device. " +
            "Please install Health Connect from the Play Store (Android 13 and below) " +
            "or ensure it's enabled in settings (Android 14+).",
        );
      }

      // Initialize the SDK
      const initialized = await initialize();
      if (!initialized) {
        throw new Error("Health Connect initialize() returned false");
      }

      // Wait a brief moment to ensure native initialization is fully complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      _initialized = true;
      return true;
    } catch (e: any) {
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
  _initialized = false;
  _initPromise = null;
}

export type PermissionResult = {
  granted: boolean;
  permissions?: Permission[];
};

/**
 * Request permissions for reading health data.
 * Must be called after ensureHealthConnectInitialized().
 */
export async function requestStepsAndHeartRatePermissions(): Promise<PermissionResult> {
  // Ensure initialize() was called first and wait for it to fully complete
  const initResult = await ensureHealthConnectInitialized();
  if (!initResult.initialized) {
    throw new Error(
      initResult.error ??
        "Health Connect not initialized. Call ensureHealthConnectInitialized() first.",
    );
  }

  if (!initResult.available) {
    throw new Error("Health Connect is not available on this device");
  }

  // Keep to the minimum needed for testing.
  const permissions: Permission[] = [
    { accessType: "read", recordType: "Steps" },
    { accessType: "read", recordType: "HeartRate" },
  ];

  try {
    // Small delay to ensure native side is fully ready after initialization
    await new Promise((resolve) => setTimeout(resolve, 150));
    const granted = await requestPermission(permissions);
    return { granted, permissions };
  } catch (e: any) {
    // Permission denied or error
    return { granted: false, permissions };
  }
}

export type StepsSample = {
  startTime: string;
  endTime: string;
  count: number;
};

export async function readStepsSamples(params: {
  startTime: Date;
  endTime: Date;
}): Promise<StepsSample[]> {
  // Ensure initialized before reading
  const initResult = await ensureHealthConnectInitialized();
  if (!initResult.initialized) {
    throw new Error("Health Connect not initialized");
  }

  // Small delay to ensure native side is fully ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  const { records } = await readRecords("Steps", {
    timeRangeFilter: {
      operator: "between",
      startTime: params.startTime.toISOString(),
      endTime: params.endTime.toISOString(),
    },
  });

  return records.map((r: any) => ({
    startTime: r.startTime,
    endTime: r.endTime,
    count: r.count,
  }));
}

export type HeartRateSample = {
  time: string;
  bpm: number;
};

export async function readHeartRateSamples(params: {
  startTime: Date;
  endTime: Date;
}): Promise<HeartRateSample[]> {
  // Ensure initialized before reading
  const initResult = await ensureHealthConnectInitialized();
  if (!initResult.initialized) {
    throw new Error("Health Connect not initialized");
  }

  // Small delay to ensure native side is fully ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  const { records } = await readRecords("HeartRate", {
    timeRangeFilter: {
      operator: "between",
      startTime: params.startTime.toISOString(),
      endTime: params.endTime.toISOString(),
    },
  });

  // HeartRate records contain an array of samples.
  const flat: HeartRateSample[] = [];
  for (const r of records as any[]) {
    const samples = r?.samples ?? [];
    for (const s of samples) {
      if (
        typeof s?.beatsPerMinute === "number" &&
        typeof s?.time === "string"
      ) {
        flat.push({ time: s.time, bpm: s.beatsPerMinute });
      }
    }
  }
  return flat;
}
