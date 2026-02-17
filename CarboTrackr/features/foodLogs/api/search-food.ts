import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";

/* ---------- API Response Shape ---------- */

type SearchFoodByQueryResponse = {
    query: string;
    food: {
        food_id: string | null;
        food_name: string | null;
        servings: {
            serving_id: string | null;
            serving_description: string | null;
            metric_serving_amount: number | null;
            metric_serving_unit: string | null;
            calories: number | null;
        }[];
    } | null;
};

/* ---------- UI Type ---------- */

export type FoodCardItem = {
    id: string;
    food_name: string;
    serving_description: string;
    metric: string;     // "28.35 g"
    calories: string;   // "255 cal"
    food_id: string;
    serving_id: string | null;
};

/* ---------- Helpers ---------- */

const formatCalories = (n: number | null | undefined) =>
    `${Math.round(Number(n ?? 0))} kcal`;

const formatMetric = (
    amt: number | null | undefined,
    unit: string | null | undefined
) => {
    if (amt == null || !unit) return "";
    const fixed = Number.isInteger(amt) ? String(amt) : amt.toFixed(2);
    return `${fixed} ${unit}`;
};

/* ---------- API Call ---------- */

export async function searchFoods(q: string) {
    const res = await axios.get<SearchFoodByQueryResponse>(
        `${API_BASE_URL}/food-logs/search`,
        { params: { q } }
    );

    const food = res.data.food;

    if (!food || !food.food_id) {
        return {
            meta: { query: res.data.query },
            items: [] as FoodCardItem[],
        };
    }

    const foodId = food.food_id; // ✅ now TypeScript knows this is string
    const foodName = food.food_name ?? "";

    const items: FoodCardItem[] = (food.servings ?? []).map((s) => ({
        id: `${foodId}:${s.serving_id ?? "null"}`,
        food_name: foodName,
        serving_description: s.serving_description ?? "",
        metric: formatMetric(s.metric_serving_amount, s.metric_serving_unit),
        calories: formatCalories(s.calories),
        food_id: foodId,          // ✅ string
        serving_id: s.serving_id, // ✅ still string | null (matches your type)
    }));

    return {
        meta: { query: res.data.query },
        items,
    };
}
