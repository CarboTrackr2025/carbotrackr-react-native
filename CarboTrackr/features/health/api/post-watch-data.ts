import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";

export type CreateWatchMetricPayload = {
  profile_id: string;
  heart_rate_bpm: number;
  steps_count: number;
  calories_burned_kcal: number;
  measured_at?: string;
};

export type WatchMetric = {
  id: number;
  profile_id: string;
  heart_rate_bpm: number;
  steps_count: number;
  calories_burned_kcal: number;
  measured_at: string;
  created_at?: string;
};

export type CreateWatchMetricResponse = {
  status: string;
  data: WatchMetric;
  timestamp: string;
  message?: string;
};

export async function createWatchMetric(payload: CreateWatchMetricPayload) {
  const res = await axios.post<CreateWatchMetricResponse>(
    `${API_BASE_URL}/watch/setData`,
    payload
  );
  return res.data;
}

