import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";

export type CreateWatchMetricPayload = {
  profile_id: string;
  heart_rate_bpm: number;
  steps_count: number;
  calories_burned_kcal: number;
  measured_at?: string;
  source?: string;
};

export type WatchMetric = {
  id: number;
  profile_id: string;
  heart_rate_bpm: number;
  steps_count: number;
  calories_burned_kcal: number;
  measured_at: string;
  created_at?: string;
  source?: string | null;
};

export type CreateWatchMetricResponse = {
  status: string;
  data: WatchMetric;
  timestamp: string;
  message?: string;
};

export async function createWatchMetric(payload: CreateWatchMetricPayload) {
  // Send both profile_id and account_id (when profile_id is an external account id)
  const body: any = { ...payload };
  if (
    typeof payload.profile_id === "string" &&
    payload.profile_id.startsWith("user_")
  ) {
    body.account_id = payload.profile_id;
  }

  const res = await axios.post<CreateWatchMetricResponse>(
    `${API_BASE_URL}/watch/metrics`,
    body,
  );
  return res.data;
}
