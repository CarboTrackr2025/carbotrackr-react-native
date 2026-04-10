import axios from "axios"
import { API_BASE_URL } from "../../../shared/api"

type DiagnosedWith =
    | "TYPE_2_DIABETES"
    | "PRE_DIABETES"
    | "NOT_APPLICABLE"

type RawHealthSettings = {
    daily_calorie_goal_kcal?: unknown
    daily_carbohydrate_goal_g?: unknown
    reminder_frequency?: unknown
    reminder_time?: unknown
    diagnosed_with?: unknown
}

type GetHealthSettingsResponse =
    | {
    status?: string
    message?: string
    data?: RawHealthSettings
}
    | RawHealthSettings

export type HealthSettingsData = {
    daily_calorie_goal_kcal: number | null
    daily_carbohydrate_goal_g: number | null
    reminder_frequency: number | null
    reminder_time: string | null
    diagnosed_with: DiagnosedWith | null
}

const extractPayload = (payload: GetHealthSettingsResponse): RawHealthSettings => {
    if (
        payload &&
        typeof payload === "object" &&
        "data" in payload &&
        payload.data &&
        typeof payload.data === "object"
    ) {
        return payload.data
    }

    return payload as RawHealthSettings
}

const normalizeNumber = (value: unknown): number | null => {
    const num = Number(value)
    return Number.isFinite(num) ? num : null
}

const normalizeInteger = (value: unknown): number | null => {
    const num = Number(value)
    return Number.isInteger(num) ? num : null
}

const normalizeDiagnosedWith = (value: unknown): DiagnosedWith | null => {
    if (typeof value !== "string") return null
    const normalized = value.trim().toUpperCase()

    if (
        normalized === "TYPE_2_DIABETES" ||
        normalized === "PRE_DIABETES" ||
        normalized === "NOT_APPLICABLE"
    ) {
        return normalized
    }

    return null
}

const normalizeTimeString = (value: unknown): string | null => {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

export async function getHealthSettings(profileId: string) {
    const url = `${API_BASE_URL}/settings/health/${profileId}`
    const res = await axios.get<GetHealthSettingsResponse>(url)
    const raw = extractPayload(res.data)

    const data: HealthSettingsData = {
        daily_calorie_goal_kcal: normalizeNumber(raw?.daily_calorie_goal_kcal),
        daily_carbohydrate_goal_g: normalizeNumber(raw?.daily_carbohydrate_goal_g),
        reminder_frequency: normalizeInteger(raw?.reminder_frequency),
        reminder_time: normalizeTimeString(raw?.reminder_time),
        diagnosed_with: normalizeDiagnosedWith(raw?.diagnosed_with),
    }

    return {
        data,
        raw: res.data,
    }
}
