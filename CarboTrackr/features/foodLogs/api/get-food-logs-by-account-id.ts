import { API_BASE_URL } from "../../../shared/api";
import axios from "axios";

/* ---------- API Types ---------- */

export type FoodLogApiItem = {
  id: string;
  profile_id: string;
  food_name: string;
  serving_size_g: number;
  number_of_servings: number;
  meal_type: string;
  calories_kcal: number;
  carbohydrates_g: number;
  protein_g: number;
  fat_g: number;
  source_type: string | null;
  source_id: string | null;
  created_at: string;
  updated_at: string;
};

type FlexibleFoodLogApiItem = FoodLogApiItem & {
  carbohydrate_g?: unknown;
  carbs_g?: unknown;
  carbs?: unknown;
  protein?: unknown;
  fat?: unknown;
  calorie?: unknown;
  calories?: unknown;
};

export type FoodLogsByAccountIdApiResponse = {
  status: "success" | "error";
  message: string;
  data: FoodLogApiItem[];
};

/* ---------- UI Type (matches your current map return) ---------- */

export type FoodLogForUI = {
  id: string;
  food_name: string;
  meal_type: string;
  calories_kcal: number;
  carbohydrates_g: number;
  protein_g: number;
  fat_g: number;
  source_type: string | null;
  source_id: string | null;
  created_at: string;
  updated_at: string;
};

/* ---------- Helpers ---------- */

const toNum = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/* ---------- Integration ---------- */

export async function getFoodLogsByAccountId(
  account_id: string,
  start_date: string,
  end_date: string,
): Promise<FoodLogForUI[]> {
  const res = await axios.get<FoodLogsByAccountIdApiResponse>(
    `${API_BASE_URL}/food-logs/${account_id}`,
    {
      params: { start_date, end_date },
    },
  );

  const payload = res.data;

  if (
    !payload ||
    payload.status !== "success" ||
    !Array.isArray(payload.data)
  ) {
    throw new Error(
      payload?.message || "Invalid response while fetching food logs.",
    );
  }

  return payload.data.map((raw) => {
    const item = raw as FlexibleFoodLogApiItem;
    const servings = toNum(item.number_of_servings);
    const calories = item.calories_kcal ?? item.calories ?? item.calorie ?? 0;
    const carbohydrates =
      item.carbohydrates_g ??
      item.carbohydrate_g ??
      item.carbs_g ??
      item.carbs ??
      0;
    const protein = item.protein_g ?? item.protein ?? 0;
    const fat = item.fat_g ?? item.fat ?? 0;

    return {
      id: item.id,
      food_name: item.food_name ?? "",
      meal_type: item.meal_type ?? "",
      calories_kcal: round2(toNum(calories) * servings),
      carbohydrates_g: round2(toNum(carbohydrates) * servings),
      protein_g: round2(toNum(protein) * servings),
      fat_g: round2(toNum(fat) * servings),
      source_type: item.source_type ?? null,
      source_id: item.source_id ?? null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  });
}
