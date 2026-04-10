import axios from "axios"
import { API_BASE_URL } from "../../../shared/api"

type DiagnosedWith =
    | "TYPE_2_DIABETES"
    | "PRE_DIABETES"
    | "NOT_APPLICABLE"

export type UpdateHealthSettingsPayload = {
    account_id: string
    daily_calorie_goal_kcal: number
    daily_carbohydrate_goal_g: number
    reminder_frequency: number
    reminder_time: string
    diagnosed_with: DiagnosedWith
}

export type UpdateHealthSettingsResponse = {
    status?: string
    message?: string
    data?: {
        daily_calorie_goal_kcal?: number | null
        daily_carbohydrate_goal_g?: number | null
        reminder_frequency?: number | null
        reminder_time?: string | null
        diagnosed_with?: DiagnosedWith | null
    }
}

export async function putHealthSettings(payload: UpdateHealthSettingsPayload) {
    const res = await axios.put<UpdateHealthSettingsResponse>(
        `${API_BASE_URL}/settings/health/save`,
        payload
    )

    return res.data
}
