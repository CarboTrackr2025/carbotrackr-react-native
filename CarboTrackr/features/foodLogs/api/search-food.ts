import axios from "axios";
import type { FoodCardItem } from "../components/FoodCard"
import { API_BASE_URL} from "../../../shared/api";

export type FatSecretServing = {
    serving_id: string;
    serving_description: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
};

export type FatSecretFoodResult = {
    food_id: string;
    food_name: string;
    brand_name: string | null;
    food_type: "Generic" | "Brand" | string;
    food_url: string;
    serving: FatSecretServing;
};

export type SearchFoodsResponse = {
    query: string;
    total_results: number;
    page_number: number;
    max_results: number;
    results: FatSecretFoodResult[];
};

export async function searchFoods(food_name: string) {
    const res = await axios.get<SearchFoodsResponse>(
        `${API_BASE_URL}/food-logs/search/`,
        { params: { food_name } }
    );

    // Map API -> FoodCardItem[]
    const items: FoodCardItem[] = res.data.results.map((r) => ({
        id: r.food_id, // ✅ unique key for FlatList
        brand_name: r.brand_name,
        food_name: r.food_name,
        serving_description: r.serving.serving_description,
        calories: Number(r.serving.calories ?? 0),
    }));

    return {
        meta: {
            query: res.data.query,
            total_results: res.data.total_results,
            page_number: res.data.page_number,
            max_results: res.data.max_results,
        },
        items,
    };
}