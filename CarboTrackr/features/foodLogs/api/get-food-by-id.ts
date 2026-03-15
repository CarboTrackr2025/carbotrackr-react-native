import { API_BASE_URL } from "../../../shared/api";
import axios from "axios";

/* ---------- API Response Types (NEW) ---------- */

export type FoodDetailsByServingIdResponse = {
    food_id: string;
    food_name: string | null;
    serving: {
        serving_id: string;
        serving_description: string | null;
        metric_serving_amount: number;
        metric_serving_unit: string | null;
        calories: number;
        carbs: number;
        protein: number;
        fat: number;
    };
};

/* ---------- UI Types (same as you had) ---------- */

export type MacroBreakdown = {
    grams: number;
    kcal: number;
    pct: number; // 0..100
};

export type FoodNutritionForUI = {
    food_id: string;
    title: string; // keep as food_name (brand already merged elsewhere)
    brand_name: string | null; // not available anymore -> null
    food_name: string;

    serving: {
        serving_id: string;
        serving_description: string;
        metric_serving_amount: number;
        metric_serving_unit: string;
    };

    calories_kcal: number;
    macros_total_kcal: number;

    carbs: MacroBreakdown;
    protein: MacroBreakdown;
    fat: MacroBreakdown;
};

/* ---------- Helpers ---------- */

const toNum = (v: unknown) => {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    return Number.isFinite(n) ? n : 0;
};

const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

/* ---------- NEW Integration ---------- */
/**
 * Fetch nutrition for a SPECIFIC serving of a food.
 * Backend route should be: GET /food-logs/food/:food_id/serving/:serving_id
 */
export async function getFoodDetailsByServingId(food_id: string, serving_id: string) {
    const res = await axios.get<FoodDetailsByServingIdResponse>(
        `${API_BASE_URL}/food-logs/food/${food_id}/serving/${serving_id}`
    );

    const data = res.data;

    if (!data?.food_id || !data?.serving?.serving_id) {
        throw new Error("Invalid response: missing food_id or serving.");
    }

    const foodName = data.food_name ?? "";
    const s = data.serving;

    const caloriesKcal = toNum(s.calories);

    const carbsG = toNum(s.carbs);
    const proteinG = toNum(s.protein);
    const fatG = toNum(s.fat);

    // grams -> kcal
    const carbsKcal = carbsG * 4;
    const proteinKcal = proteinG * 4;
    const fatKcal = fatG * 9;

    const macrosTotalKcal = carbsKcal + proteinKcal + fatKcal;

    const ui: FoodNutritionForUI = {
        food_id: data.food_id,
        title: foodName,          // brand is already included in food_name in your search API
        brand_name: null,         // no longer returned by this endpoint
        food_name: foodName,

        serving: {
            serving_id: s.serving_id,
            serving_description: s.serving_description ?? "",
            metric_serving_amount: toNum(s.metric_serving_amount),
            metric_serving_unit: s.metric_serving_unit ?? "",
        },

        calories_kcal: caloriesKcal,
        macros_total_kcal: macrosTotalKcal,

        carbs: {
            grams: carbsG,
            kcal: carbsKcal,
            pct: pct(carbsKcal, macrosTotalKcal),
        },
        protein: {
            grams: proteinG,
            kcal: proteinKcal,
            pct: pct(proteinKcal, macrosTotalKcal),
        },
        fat: {
            grams: fatG,
            kcal: fatKcal,
            pct: pct(fatKcal, macrosTotalKcal),
        },
    };

    return ui;
}
