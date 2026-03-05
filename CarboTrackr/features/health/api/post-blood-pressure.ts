import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";

export type BloodPressureInput = {
    systolic_mmHg: number;
    diastolic_mmHg: number;
};

export type CreateBloodPressurePayload = BloodPressureInput & {
    account_id: string;
};

export type CreateBloodPressureResponse = {
    recorded_at?: string;
    created_at?: string;
    timestamp?: string;
    data?: {
        recorded_at?: string;
        created_at?: string;
        timestamp?: string;
    };
};

export const extractTimestamp = (data: CreateBloodPressureResponse): string | null => {
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

export async function createBloodPressure(payload: CreateBloodPressurePayload) {
    const res = await axios.post<CreateBloodPressureResponse>(
        `${API_BASE_URL}/health/blood-pressure/create`,
        payload
    );

    return {
        data: res.data,
        timestamp: extractTimestamp(res.data),
    };
}
