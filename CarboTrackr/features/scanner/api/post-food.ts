import axios from "axios"
import { API_BASE_URL } from "../../../shared/api"

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"

export type SaveScannedFoodLogRequest = {
    account_id: string
    food_name: string
    meal_type: MealType | string
    source_id: string
    serving_size_g: number | string
    serving_size_ml?: number | string | null
    number_of_servings?: number | string
    calories_kcal: number | string
    carbohydrates_g: number | string
    protein_g: number | string
    fat_g: number | string
}

export type ScannerFoodLog = {
    id?: string | number
    created_at?: string
    updated_at?: string
    recorded_at?: string
} & Record<string, any>

export type SaveScannedFoodLogResponse =
    | {
          ok: true
          food_log: ScannerFoodLog | null
      }
    | {
          ok?: false
          error: string
          details?: any
      }

const normalizeMealType = (v: MealType | string): MealType =>
    String(v || "").trim().toUpperCase() as MealType

const toNumber = (v: number | string | null | undefined): number => {
    const n = Number(v)
    return Number.isFinite(n) ? n : n
}

const toNumberOrNull = (v: number | string | null | undefined): number | null => {
    if (v == null || v === "") return null
    const n = Number(v)
    return Number.isFinite(n) ? n : n
}

export async function postFoodLogFromNutritionalLabelScanner(input: SaveScannedFoodLogRequest) {
    const payload = {
        account_id: String(input.account_id ?? "").trim(),
        food_name: String(input.food_name ?? "").trim(),
        meal_type: normalizeMealType(input.meal_type),
        source_id: String(input.source_id ?? "").trim(),
        serving_size_g: toNumber(input.serving_size_g),
        serving_size_ml: toNumberOrNull(input.serving_size_ml),
        number_of_servings: toNumber(input.number_of_servings ?? 1),
        calories_kcal: toNumber(input.calories_kcal),
        carbohydrates_g: toNumber(input.carbohydrates_g),
        protein_g: toNumber(input.protein_g),
        fat_g: toNumber(input.fat_g),
    }

    const res = await axios.post<SaveScannedFoodLogResponse>(
        `${API_BASE_URL}/scanner/nutritional_label/save`,
        payload
    )

    if (res.data?.ok !== true) {
        throw new Error(String(res.data?.error ?? "Failed to save food log"))
    }

    return {
        food_log: res.data?.food_log ?? null,
        raw: res.data,
    }
}

export type SaveSolidFoodLogRequest = {
    account_id: string
    food_name: string
    meal_type: MealType | string
    meal_id: string
    number_of_servings?: number | string
    calories_kcal: number | string
    carbohydrates_g: number | string
    protein_g: number | string
    fat_g: number | string
    detected_items?: Array<{
        source_id?: string
        food_name?: string
        confidence?: number | string
    }>
}

export async function postFoodLogFromSolidFoodScanner(input: SaveSolidFoodLogRequest) {
    const payload = {
        account_id: String(input.account_id ?? "").trim(),
        food_name: String(input.food_name ?? "").trim(),
        meal_type: normalizeMealType(input.meal_type),
        meal_id: String(input.meal_id ?? "").trim(),
        number_of_servings: toNumber(input.number_of_servings ?? 1),
        calories_kcal: toNumber(input.calories_kcal),
        carbohydrates_g: toNumber(input.carbohydrates_g),
        protein_g: toNumber(input.protein_g),
        fat_g: toNumber(input.fat_g),
        detected_items: Array.isArray(input.detected_items) ? input.detected_items : [],
    }

    const res = await axios.post<SaveScannedFoodLogResponse>(
        `${API_BASE_URL}/scanner/solid_food/save`,
        payload
    )

    if (res.data?.ok !== true) {
        throw new Error(String(res.data?.error ?? "Failed to save food log"))
    }

    return {
        food_log: res.data?.food_log ?? null,
        raw: res.data,
    }
}
