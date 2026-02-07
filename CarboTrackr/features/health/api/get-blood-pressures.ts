import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";

export type BpMeasurement = {
    id: string;
    systolic_mmHg: number;
    diastolic_mmHg: number;
    created_at: string;
};

export type GetBloodPressureResponse =
    | BpMeasurement[]
    | {
    data?: any[];
    measurements?: any[];
    items?: any[];
};

const extractMeasurements = (payload: GetBloodPressureResponse): any[] => {
    if (Array.isArray(payload)) return payload as any[];
    return (payload?.data ?? payload?.measurements ?? payload?.items ?? []) as any[];
};

const normalizeMeasurement = (m: any): BpMeasurement | null => {
    const created = m?.created_at ?? m?.recorded_at ?? m?.timestamp ?? m?.date ?? null;

    const systolic = Number(m?.systolic_mmHg ?? m?.systolic ?? m?.systolic_value);
    const diastolic = Number(m?.diastolic_mmHg ?? m?.diastolic ?? m?.diastolic_value);

    const createdAt = typeof created === "string" ? created : null;
    if (!Number.isFinite(systolic) || !Number.isFinite(diastolic) || !createdAt) return null;

    const t = new Date(createdAt).getTime();
    if (Number.isNaN(t)) return null;

    return {
        id: String(m?.id ?? m?._id ?? `${t}-${systolic}-${diastolic}`),
        systolic_mmHg: systolic,
        diastolic_mmHg: diastolic,
        created_at: createdAt,
    };
};

export async function getBloodPressureReport(args: {
    profileId: string;
    startDate: Date;
    endDate: Date;
}) {
    const { profileId, startDate, endDate } = args;

    const url = `${API_BASE_URL}/health/${profileId}/blood-pressure/report`;
    const params = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
    };

    const res = await axios.get<GetBloodPressureResponse>(url, { params });

    const raw = extractMeasurements(res.data);
    const cleaned = raw
        .map(normalizeMeasurement)
        .filter((x): x is BpMeasurement => x !== null)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return {
        measurements: cleaned,
        raw: res.data,
    };
}
