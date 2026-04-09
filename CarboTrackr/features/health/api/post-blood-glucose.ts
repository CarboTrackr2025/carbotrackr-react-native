import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";

export type BloodGlucoseInput = {
  level: string;
  meal_context: "PRE" | "POST";
};

export type CreateBloodGlucosePayload = BloodGlucoseInput & {
  account_id: string;
};

export type CreateBloodGlucoseResponse = {
  recorded_at?: string;
  created_at?: string;
  timestamp?: string;
  data?: {
    recorded_at?: string;
    created_at?: string;
    timestamp?: string;
  };
};

export const extractTimestamp = (
  data: CreateBloodGlucoseResponse,
): string | null => {
  return (
    data?.recorded_at ??
    data?.created_at ??
    data?.timestamp ??
    data?.data?.recorded_at ??
    data?.data?.created_at ??
    data?.data?.timestamp ??
    null
  );
};

export async function createBloodGlucose(payload: CreateBloodGlucosePayload) {
  const res = await axios.post<CreateBloodGlucoseResponse>(
    `${API_BASE_URL}/health/blood-glucose/create`,
    payload,
  );

  return {
    data: res.data,
    timestamp: extractTimestamp(res.data),
  };
}
