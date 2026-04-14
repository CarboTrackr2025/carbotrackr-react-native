import axios from "axios"
import { API_BASE_URL } from "../../../shared/api"
import { requestDashboardRefresh } from "../../../shared/utils/dashboard-refresh"

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"

export type CreateFoodLogRequest = {
    account_id: string
    food_id: string
    serving_id: string
    meal_type: MealType
    number_of_servings?: number
}

export type CreateFoodLogResponse = {
    timestamp: string
}

export async function createFoodLog(input: CreateFoodLogRequest) {
    const res = await axios.post(
        `${API_BASE_URL}/food-logs/create`,
        {
            account_id: input.account_id,
            food_id: input.food_id,
            serving_id: input.serving_id,
            meal_type: input.meal_type,
            number_of_servings: input.number_of_servings ?? 1,
        }
    )

    const updatedAt = res.data?.food_log?.updated_at

    requestDashboardRefresh()

    return updatedAt
}
