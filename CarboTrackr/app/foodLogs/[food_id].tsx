import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import {
    getFoodDetailsByServingId,
    type FoodNutritionForUI,
} from "../../features/foodLogs/api/get-food-by-id"; // ✅ update path if you renamed the file

export default function FoodByServingScreen() {
    const { food_id, serving_id } = useLocalSearchParams<{
        food_id?: string;
        serving_id?: string;
    }>();

    const [data, setData] = useState<FoodNutritionForUI | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function run() {
            try {
                setLoading(true);
                setError(null);

                if (!food_id) throw new Error("Missing food_id param");
                if (!serving_id) throw new Error("Missing serving_id param");

                const res = await getFoodDetailsByServingId(String(food_id), String(serving_id));

                if (!mounted) return;
                setData(res);
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message ?? "Something went wrong");
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        }

        run();

        return () => {
            mounted = false;
        };
    }, [food_id, serving_id]);

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator />
                <Text style={{ marginTop: 12 }}>Loading food…</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
                <Text style={{ fontWeight: "700", marginBottom: 8 }}>Error</Text>
                <Text>{error}</Text>
                <Text style={{ marginTop: 12, opacity: 0.7 }}>
                    food_id: {String(food_id)} | serving_id: {String(serving_id)}
                </Text>
            </View>
        );
    }

    if (!data) {
        return (
            <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
                <Text>No data.</Text>
            </View>
        );
    }

    const round = (n: number) => Math.round(n * 100) / 100;

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Title */}
            <Text style={{ fontSize: 18, fontWeight: "800" }}>{data.title}</Text>

            {/* Serving */}
            <Text style={{ marginTop: 8, opacity: 0.8 }}>
                Serving: {data.serving.serving_description} ({data.serving.metric_serving_amount}
                {data.serving.metric_serving_unit})
            </Text>

            {/* Calories */}
            <Text style={{ marginTop: 16, fontSize: 16, fontWeight: "700" }}>
                Calories: {round(data.calories_kcal)} kcal
            </Text>

            {/* Macro breakdown */}
            <View style={{ marginTop: 16 }}>
                <Text style={{ fontWeight: "700" }}>Carbs</Text>
                <Text>
                    {round(data.carbs.grams)} g | {round(data.carbs.kcal)} kcal | {round(data.carbs.pct)}%
                </Text>

                <Text style={{ marginTop: 12, fontWeight: "700" }}>Protein</Text>
                <Text>
                    {round(data.protein.grams)} g | {round(data.protein.kcal)} kcal |{" "}
                    {round(data.protein.pct)}%
                </Text>

                <Text style={{ marginTop: 12, fontWeight: "700" }}>Fat</Text>
                <Text>
                    {round(data.fat.grams)} g | {round(data.fat.kcal)} kcal | {round(data.fat.pct)}%
                </Text>
            </View>

            {/* Debug */}
            <View style={{ marginTop: 20, paddingTop: 12, borderTopWidth: 1 }}>
                <Text style={{ fontWeight: "700" }}>Debug</Text>
                <Text>food_id: {data.food_id}</Text>
                <Text>serving_id: {data.serving.serving_id}</Text>
                <Text>macros_total_kcal: {round(data.macros_total_kcal)}</Text>
            </View>
        </ScrollView>
    );
}
