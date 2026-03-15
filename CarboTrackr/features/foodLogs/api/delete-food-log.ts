import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export type DeleteFoodLogData = {
    id: string;
    food_name: string;
    meal_type: MealType;
    calories_kcal: number;
    carbohydrates_g: number;
    protein_g: number;
    fat_g: number;
};

export type DeleteFoodLogApiResponse = {
    status: "success" | "error";
    message: string;
    data?: DeleteFoodLogData;
};

export async function deleteFoodLog(foodLogId: string): Promise<DeleteFoodLogData> {
    const id = String(foodLogId ?? "").trim();

    if (!id) {
        throw new Error("foodLogId is required");
    }

    const res = await axios.delete<DeleteFoodLogApiResponse>(
        `${API_BASE_URL}/food-logs/${id}`
    );

    const payload = res.data;

    if (!payload || payload.status !== "success" || !payload.data) {
        throw new Error(payload?.message || "Failed to delete food log.");
    }

    return payload.data;
}