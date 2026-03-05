import axios from "axios"
import {API_BASE_URL} from "../../../shared/api"

type RawAccountSettings = {
    email?: unknown
    gender?: unknown
    date_of_birth?: unknown
    height_cm?: unknown
    weight_kg?: unknown
}

type GetAccountSettingsResponse =
    | {
    status?: string
    message?: string
    data?: RawAccountSettings
}
    | RawAccountSettings

export type AccountSettingsData = {
    email: string
    gender: string | number | null
    date_of_birth: string | null
    height_cm: number | null
    weight_kg: number | null
}

const extractPayload = (payload: GetAccountSettingsResponse): RawAccountSettings => {
    if (payload && typeof payload === "object" && "data" in payload && payload.data) {
        return payload.data
    }

    return payload as RawAccountSettings
}

const normalizeGender = (value: unknown): string | number | null => {
    if (typeof value !== "string") return null

    const normalized = value.trim().toUpperCase()
    if (normalized === "MALE" || normalized === "FEMALE") {
        return normalized
    }

    return null
}

const normalizeDateOfBirth = (value: unknown): string | null => {
    if (typeof value !== "string") return null

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null

    return parsed.toISOString()
}

const normalizeNumber = (value: unknown): number | null => {
    const num = Number(value)
    return Number.isFinite(num) ? num : null
}

export async function getAccountSettings(profileId: string) {
    const url = `${API_BASE_URL}/settings/account/${profileId}`
    const res = await axios.get<GetAccountSettingsResponse>(url)
    const raw = extractPayload(res.data)

    const data: AccountSettingsData = {
        email: typeof raw?.email === "string" ? raw.email : "",
        gender: normalizeGender(raw?.gender),
        date_of_birth: normalizeDateOfBirth(raw?.date_of_birth),
        height_cm: normalizeNumber(raw?.height_cm),
        weight_kg: normalizeNumber(raw?.weight_kg),
    }

    return {
        data,
        raw: res.data,
    }
}