import axios from "axios"
import { API_BASE_URL } from "../../../shared/api"

type DiagnosedWith =
    | "TYPE_2_DIABETES"
    | "PRE_DIABETES"
    | "NOT_APPLICABLE"

export type PostAccountAndHealthSettingsPayload = {
    account_id: string
    gender: "MALE" | "FEMALE" | null
    date_of_birth: string | null
    height_cm: number | null
    weight_kg: number | null
    reminder_frequency: number | null
    diagnosed_with: DiagnosedWith | null
}

export type PostAccountAndHealthSettingsResponse = {
    status?: string
    message?: string
    data?: {
        account_id?: string
        gender?: "MALE" | "FEMALE" | null
        date_of_birth?: string | null
        height_cm?: number | null
        weight_kg?: number | null
        reminder_frequency?: number | null
        diagnosed_with?: DiagnosedWith | null
    }
}

export async function postAccountAndHealthSettings(
    payload: PostAccountAndHealthSettingsPayload
) {
    const res = await axios.post<PostAccountAndHealthSettingsResponse>(
        `${API_BASE_URL}/settings/save`,
        payload
    )

    return {
        data: res.data,
        message: res.data?.message ?? null,
        status: res.data?.status ?? null,
    }
}