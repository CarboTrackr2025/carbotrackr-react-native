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
                <Text style={styles.loadingText}>Loading food…</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorWrap}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorBody}>{error}</Text>
                <Text style={styles.errorMeta}>
                    food_id: {String(food_id)} | serving_id: {String(serving_id)}
                </Text>
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.noDataWrap}>
                <Text>No data.</Text>
            </View>
        );
    }

    const round = (n: number) => Math.round(n * 100) / 100;

    const scaledCalories = data.calories_kcal * servings;

    const scaledCarbsG = data.carbs.grams * servings;
    const scaledProteinG = data.protein.grams * servings;
    const scaledFatG = data.fat.grams * servings;

    const scaledCarbsK = data.carbs.kcal * servings;
    const scaledProteinK = data.protein.kcal * servings;
    const scaledFatK = data.fat.kcal * servings;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.ringWrap}>
                <CalorieRing nutrition={data} servings={servings} size={180} />
            </View>

            <Text style={styles.label}>Food</Text>
            <GradientTextDisplay text={data.title} />

            <Text style={styles.servingText}>
                Serving: {data.serving.serving_description} ({data.serving.metric_serving_amount}
                {data.serving.metric_serving_unit})
            </Text>

            <Text style={styles.label}>Number of Servings</Text>
            <GradientTextInput
                keyboardType="numeric"
                value={servingsText}
                onChangeText={setServingsText}
            />

            <Text style={styles.caloriesText}>
                Calories: {round(scaledCalories)} kcal
            </Text>

            <View style={styles.macrosWrap}>
                <Text style={styles.macroTitle}>Carbs</Text>
                <Text style={styles.macroLine}>
                    {round(scaledCarbsG)} g | {round(scaledCarbsK)} kcal |{" "}
                    {round(data.carbs.pct)}%
                </Text>

                <Text style={[styles.macroTitle, styles.macroTitleSpacing]}>Protein</Text>
                <Text style={styles.macroLine}>
                    {round(scaledProteinG)} g | {round(scaledProteinK)} kcal |{" "}
                    {round(data.protein.pct)}%
                </Text>

                <Text style={[styles.macroTitle, styles.macroTitleSpacing]}>Fat</Text>
                <Text style={styles.macroLine}>
                    {round(scaledFatG)} g | {round(scaledFatK)} kcal | {round(data.fat.pct)}%
                </Text>
            </View>

            <View style={styles.debugWrap}>
                <Text style={styles.debugTitle}>Debug</Text>
                <Text>food_id: {data.food_id}</Text>
                <Text>serving_id: {data.serving.serving_id}</Text>
                <Text>macros_total_kcal: {round(data.macros_total_kcal)}</Text>
                <Text>servings: {servings}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    // layout
    container: {
        padding: 16,
    },

    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    ringWrap: {
        marginTop: 16,
        alignItems: "center",
    },

    // loading
    loadingText: {
        marginTop: 12,
    },

    // labels
    label: {
        marginTop: 8,
        marginBottom: 4,
        fontSize: 14,
        fontWeight: "600",
        color: color.black,
    },

    // serving row
    servingText: {
        marginTop: 8,
        opacity: 0.8,
    },

    // calories row
    caloriesText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: "700",
    },

    // macros section
    macrosWrap: {
        marginTop: 16,
    },
    macroTitle: {
        fontWeight: "700",
    },
    macroTitleSpacing: {
        marginTop: 12,
    },
    macroLine: {},

    // debug section
    debugWrap: {
        marginTop: 20,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    debugTitle: {
        fontWeight: "700",
    },

    // error states
    errorWrap: {
        flex: 1,
        padding: 16,
        justifyContent: "center",
    },
    errorTitle: {
        fontWeight: "700",
        marginBottom: 8,
    },
    errorBody: {},
    errorMeta: {
        marginTop: 12,
        opacity: 0.7,
    },

    noDataWrap: {
        flex: 1,
        padding: 16,
        justifyContent: "center",
    },
});
