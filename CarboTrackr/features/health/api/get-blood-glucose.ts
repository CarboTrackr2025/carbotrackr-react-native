import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";

export type GlucoseMeasurement = {
  id: string;
  level: number;
  created_at: string;
  meal_context: "PRE" | "POST" | null;
};

export type GetBloodGlucoseResponse =
  | GlucoseMeasurement[]
  | {
      data?: any[];
      measurements?: any[];
      items?: any[];
    };

const extractMeasurements = (payload: GetBloodGlucoseResponse): any[] => {
  if (Array.isArray(payload)) return payload as any[];
  return (payload?.data ??
    payload?.measurements ??
    payload?.items ??
    []) as any[];
};

const normalizeMeasurement = (m: any): GlucoseMeasurement | null => {
  const created =
    m?.created_at ?? m?.recorded_at ?? m?.timestamp ?? m?.date ?? null;
  const level = Number(m?.level ?? m?.glucose_level ?? m?.value);

  const createdAt = typeof created === "string" ? created : null;
  if (!Number.isFinite(level) || !createdAt) return null;

  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return null;

  return {
    id: String(m?.id ?? m?._id ?? `${t}-${level}`),
    level,
    created_at: createdAt,
    meal_context:
      m?.meal_context === "PRE" || m?.meal_context === "POST"
        ? m.meal_context
        : null,
  };
};

export async function getBloodGlucoseReport(args: {
  accountId: string;
  startDate: Date;
  endDate: Date;
}) {
  const { accountId, startDate, endDate } = args;

  const url = `${API_BASE_URL}/health/${accountId}/blood-glucose/report`;
  const params = {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  };

  const res = await axios.get<GetBloodGlucoseResponse>(url, { params });

  const raw = extractMeasurements(res.data);
  const cleaned = raw
    .map(normalizeMeasurement)
    .filter((x): x is GlucoseMeasurement => x !== null)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  return {
    measurements: cleaned,
    raw: res.data,
  };
}
