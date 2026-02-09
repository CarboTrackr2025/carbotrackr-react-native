import type { FoodCardProps } from "./components/FoodCard";

export const DUMMY_SEARCH_RESULTS: Omit<FoodCardProps, "onAdd">[] = [
    {
        id: "15834",
        brand_name: null,
        food_name: "Baked Beans (Canned)",
        serving_description: "1.0 can",
        calories: 250,
    },
    {
        id: "15835",
        brand_name: null,
        food_name: "Baked Beans (Canned)",
        serving_description: "1.0 can",
        calories: 260,
    },
    {
        id: "15836",
        brand_name: null,
        food_name: "Baked Beans",
        serving_description: "1.0 cup",
        calories: 130,
    },
    {
        id: "1662427",
        brand_name: "Barilla",
        food_name: "Thin Spaghetti",
        serving_description: "2 oz",
        calories: 200,
    },
];
