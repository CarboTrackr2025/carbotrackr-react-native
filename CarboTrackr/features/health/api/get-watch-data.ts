import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";
import { WatchMetric } from "./post-watch-data";

export type GetWatchMetricsParams = {
  profile_id: string;
  from?: string;
  to?: string;
  limit?: number;
};

export type GetWatchMetricsResponse = {
  status: string;
  data: WatchMetric[];
  count: number;
  timestamp: string;
  message?: string;
};

export async function getWatchMetrics(params: GetWatchMetricsParams) {
  const res = await axios.get<GetWatchMetricsResponse>(
    `${API_BASE_URL}/watch/metrics`,
    { params },
  );
  return res.data;
}
