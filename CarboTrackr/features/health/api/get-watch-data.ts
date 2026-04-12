import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";
import { WatchMetric } from "./post-watch-data";

export type GetWatchMetricsParams = {
  profile_id: string;
  account_id?: string;
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

type WatchMetricsPayload =
  | GetWatchMetricsResponse
  | WatchMetric[]
  | {
      data?: WatchMetric[];
      items?: WatchMetric[];
      metrics?: WatchMetric[];
      message?: string;
      status?: string;
    };

const extractRows = (payload: WatchMetricsPayload): WatchMetric[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.metrics)) return payload.metrics;
  return [];
};

export async function getWatchMetrics(params: GetWatchMetricsParams) {
  const baseQuery = {
    ...params,
    account_id: params.account_id ?? params.profile_id,
  };

  const first = await axios.get<WatchMetricsPayload>(
    `${API_BASE_URL}/watch/metrics`,
    { params: baseQuery },
  );

  let rows = extractRows(first.data);
  if (rows.length > 0) {
    return {
      rows,
      raw: first.data,
    };
  }

  const altDateQuery = {
    ...baseQuery,
    start_date: baseQuery.from,
    end_date: baseQuery.to,
  } as Record<string, unknown>;
  delete altDateQuery.from;
  delete altDateQuery.to;

  const second = await axios.get<WatchMetricsPayload>(
    `${API_BASE_URL}/watch/metrics`,
    { params: altDateQuery },
  );

  rows = extractRows(second.data);
  if (rows.length > 0) {
    return {
      rows,
      raw: second.data,
    };
  }

  const noDateQuery = {
    profile_id: baseQuery.profile_id,
    account_id: baseQuery.account_id,
    limit: baseQuery.limit,
  };

  const third = await axios.get<WatchMetricsPayload>(
    `${API_BASE_URL}/watch/metrics`,
    { params: noDateQuery },
  );

  const payload = third.data;
  return {
    rows: extractRows(payload),
    raw: payload,
  };
}
