import { API_BASE_URL} from "../../../shared/api";
import axios from "axios";

export type FatSecretServingDetailed = {
    serving_id: string;
    serving_description: string;
    metric_serving_amount: number;
    metric_serving_unit: string; // "g", "ml", etc
    calories: number; // kcal
    carbs: number;    // g
    protein: number;  // g
    fat: number;      // g
};

export type FatSecretFoodByIdResponse = {
    food_id: string;
    food_name: string;
    brand_name: string | null;
    food_type: "Generic" | "Brand" | string;
    servings: FatSecretServingDetailed[];
};

export type MacroBreakdown = {
    grams: number;
    kcal: number;
    pct: number; // 0..100
};

export type FoodNutritionForUI = {
    food_id: string;
    title: string;           // "Brand Food" or "Food"
    brand_name: string | null;
    food_name: string;

    serving: {
        serving_id: string;
        serving_description: string;
        metric_serving_amount: number;
        metric_serving_unit: string;
    };

    calories_kcal: number;      // FatSecret reported calories
    macros_total_kcal: number;  // computed from macros (for % consistency)

    carbs: MacroBreakdown;
    protein: MacroBreakdown;
    fat: MacroBreakdown;
};

const toNum = (v: unknown) => {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    return Number.isFinite(n) ? n : 0;
};

const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

const formatTitle = (food_name: string, brand_name: string | null) =>
    brand_name ? `${brand_name} ${food_name}` : food_name;

export async function getFoodById(food_id: string) {
    const res = await axios.get<FatSecretFoodByIdResponse>(
        `${API_BASE_URL}/food-logs/food/${food_id}`
    );

    const data = res.data;

    // Choose serving: prefer "100 g" or metric_serving_amount === 100 (common UX choice)
    const serving =
        data.servings.find((s) => s.metric_serving_unit === "g" && toNum(s.metric_serving_amount) === 100) ??
        data.servings.find((s) => (s.serving_description ?? "").toLowerCase().includes("100 g")) ??
        data.servings[0];

    if (!serving) {
        throw new Error("No servings found for this food.");
    }

    const caloriesKcal = toNum(serving.calories);

    const carbsG = toNum(serving.carbs);
    const proteinG = toNum(serving.protein);
    const fatG = toNum(serving.fat);

    // Convert grams -> kcal
    const carbsKcal = carbsG * 4;
    const proteinKcal = proteinG * 4;
    const fatKcal = fatG * 9;

    // Use macro-total for percentages so slices/percents sum to ~100
    const macrosTotalKcal = carbsKcal + proteinKcal + fatKcal;

    const ui: FoodNutritionForUI = {
        food_id: data.food_id,
        title: formatTitle(data.food_name, data.brand_name),
        brand_name: data.brand_name,
        food_name: data.food_name,

        serving: {
            serving_id: serving.serving_id,
            serving_description: serving.serving_description,
            metric_serving_amount: toNum(serving.metric_serving_amount),
            metric_serving_unit: serving.metric_serving_unit,
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
