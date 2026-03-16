import {
  initialize,
  requestPermission,
  readRecords,
  type Permission,
} from "react-native-health-connect";

export type HealthConnectInitResult = {
  initialized: boolean;
  error?: string;
};

export async function ensureHealthConnectInitialized(): Promise<HealthConnectInitResult> {
  try {
    const initialized = await initialize();
    return { initialized };
  } catch (e: any) {
    return { initialized: false, error: e?.message ?? String(e) };
  }
}

export async function requestStepsAndHeartRatePermissions() {
  // Keep to the minimum needed for testing.
  const permissions: Permission[] = [
    { accessType: "read", recordType: "Steps" },
    { accessType: "read", recordType: "HeartRate" },
  ];

  return requestPermission(permissions);
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
