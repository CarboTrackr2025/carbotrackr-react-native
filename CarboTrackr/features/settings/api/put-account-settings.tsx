import axios from "axios"
import {API_BASE_URL} from "../../../shared/api"

export type UpdateAccountSettingsPayload = {
    account_id: string
    gender: "MALE" | "FEMALE" | null
    date_of_birth: string | null
    height_cm: number | null
    weight_kg: number | null
}

export type UpdateAccountSettingsResponse = {
    status?: string
    message?: string
    data?: {
        account_id?: string
        gender?: string
        date_of_birth?: string
        height_cm?: number
        weight_kg?: number
    }
}

export async function putAccountSettings(
    payload: UpdateAccountSettingsPayload
) {
    const res = await axios.put<UpdateAccountSettingsResponse>(
        `${API_BASE_URL}/settings/account/save`,
        payload
    )

    return {
        data: res.data,
        message: res.data?.message ?? null,
        status: res.data?.status ?? null,
    }
}