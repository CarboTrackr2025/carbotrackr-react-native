import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    View,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { color } from "../../shared/constants/colors";

import {
    getFoodDetailsByServingId,
    type FoodNutritionForUI,
} from "../../features/foodLogs/api/get-food-by-id";

import { GradientTextDisplay } from "../../shared/components/GradientTextDisplay";
import { GradientTextInput } from "../../shared/components/GradientTextInput";
import { CalorieRing } from "../../shared/components/CalorieRing";

export default function FoodByServingScreen() {
    const { food_id, serving_id } = useLocalSearchParams<{
        food_id?: string;
        serving_id?: string;
    }>();

    const [data, setData] = useState<FoodNutritionForUI | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // ✅ servings input (controlled)
    const [servingsText, setServingsText] = useState("1");
    const servings = Number(servingsText) || 1;

    useEffect(() => {
        let mounted = true;

        async function run() {
            try {
                setLoading(true);
                setError(null);

                if (!food_id) throw new Error("Missing food_id param");
                if (!serving_id) throw new Error("Missing serving_id param");

                const res = await getFoodDetailsByServingId(
                    String(food_id),
                    String(serving_id)
                );

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
            <View style={styles.center}>
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

    // scaled display values for text (ring handles scaling internally too)
    const scaledCalories = data.calories_kcal * servings;

    const scaledCarbsG = data.carbs.grams * servings;
    const scaledProteinG = data.protein.grams * servings;
    const scaledFatG = data.fat.grams * servings;

    const scaledCarbsK = data.carbs.kcal * servings;
    const scaledProteinK = data.protein.kcal * servings;
    const scaledFatK = data.fat.kcal * servings;

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>

            <View style={{ marginTop: 16, alignItems: "center" }}>
                <CalorieRing nutrition={data} servings={servings} size={180} />
            </View>

            <Text style={styles.label}>Food</Text>
            <GradientTextDisplay text={data.title} />

            <Text style={{ marginTop: 8, opacity: 0.8 }}>
                Serving: {data.serving.serving_description} ({data.serving.metric_serving_amount}
                {data.serving.metric_serving_unit})
            </Text>

            <Text style={styles.label}>Number of Servings</Text>
            <GradientTextInput
                keyboardType="numeric"
                value={servingsText}
                onChangeText={setServingsText}
            />

            {/* Calories */}
            <Text style={{ marginTop: 16, fontSize: 16, fontWeight: "700" }}>
                Calories: {round(scaledCalories)} kcal
            </Text>

            {/* Macro breakdown */}
            <View style={{ marginTop: 16 }}>
                <Text style={{ fontWeight: "700" }}>Carbs</Text>
                <Text>
                    {round(scaledCarbsG)} g | {round(scaledCarbsK)} kcal |{" "}
                    {round(data.carbs.pct)}%
                </Text>

                <Text style={{ marginTop: 12, fontWeight: "700" }}>Protein</Text>
                <Text>
                    {round(scaledProteinG)} g | {round(scaledProteinK)} kcal |{" "}
                    {round(data.protein.pct)}%
                </Text>

                <Text style={{ marginTop: 12, fontWeight: "700" }}>Fat</Text>
                <Text>
                    {round(scaledFatG)} g | {round(scaledFatK)} kcal | {round(data.fat.pct)}%
                </Text>
            </View>

            {/* Debug */}
            <View style={{ marginTop: 20, paddingTop: 12, borderTopWidth: 1 }}>
                <Text style={{ fontWeight: "700" }}>Debug</Text>
                <Text>food_id: {data.food_id}</Text>
                <Text>serving_id: {data.serving.serving_id}</Text>
                <Text>macros_total_kcal: {round(data.macros_total_kcal)}</Text>
                <Text>servings: {servings}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    label: {
        marginTop: 8,
        marginBottom: 4,
        fontSize: 14,
        fontWeight: "600",
        color: color.black,
    },
});
