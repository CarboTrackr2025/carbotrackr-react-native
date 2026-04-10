import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    View,
    StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {color, gradient} from "../../../shared/constants/colors";
import {
    getFoodDetailsByServingId,
    type FoodNutritionForUI,
} from "../../../features/foodLogs/api/get-food-by-id";
import { GradientTextDisplay } from "../../../shared/components/GradientTextDisplay";
import { GradientTextInput } from "../../../shared/components/GradientTextInput";
import { CalorieRing } from "../../../shared/components/CalorieRing";
import { Dropdown} from "../../../shared/components/Dropdown";
import { Button } from "../../../shared/components/Button";
import { formatPhilippinesTime } from "../../../shared/utils/formatters";
import { createFoodLog } from "../../../features/foodLogs/api/post-food"
import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";

export default function FoodByServingScreen() {
    const { food_id, serving_id } = useLocalSearchParams<{
        food_id?: string;
        serving_id?: string;
    }>();
    const { userId } = useAuth();

    const [data, setData] = useState<FoodNutritionForUI | null>(null);
    const [mealType, setMealType] = useState<string | number | null>(null);
    const [timestamp, setTimestamp] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const recordedText = timestamp ? formatPhilippinesTime(timestamp) : "—"

    const mealOptions = [
        { label: "Breakfast", value: "BREAKFAST" },
        { label: "Lunch", value: "LUNCH" },
        { label: "Dinner", value: "DINNER" },
        { label: "Snack", value: "SNACK" },
    ]

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [servingsText, setServingsText] = useState("1");
    const servings = Number(servingsText) || 1;

    const submitting = saving;
    const canSubmit = !!mealType && servings > 0 && !saving;


    const handleSubmit = async () => {
        try {
            if (!food_id) throw new Error("Missing food_id param");
            if (!serving_id) throw new Error("Missing serving_id param");
            if (!mealType) throw new Error("Please select a meal type");

            setSaving(true);

            const accountIdFromClerk = userId;
            if (!accountIdFromClerk) {
                throw new Error("User ID from Clerk Auth API not found");
            }

            const ts = await createFoodLog({
                account_id: accountIdFromClerk,
                food_id: String(food_id),
                serving_id: String(serving_id),
                meal_type: String(mealType) as any, // or type it properly to MealType
                number_of_servings: servings,
            });

            setTimestamp(ts);
        } catch (e: any) {
            setError(e?.message ?? "Failed to save food log");
        } finally {
            setSaving(false);
        }
    };

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

    const servingAmount = data.serving.metric_serving_amount;
    const servingUnit = data.serving.metric_serving_unit;
    const servingDesc = data.serving.serving_description;
    const servingText = `${servingAmount} ${servingUnit}${servingDesc ? ` (${servingDesc})` : ""}`;

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            scrollEnabled={false}
            style={styles.scrollView}
        >
            <View style={styles.ringWrap}>
                <CalorieRing
                    nutrition={{
                        calories_kcal: data.calories_kcal,
                        carbs: data.carbs,
                        protein: data.protein,
                        fat: data.fat,
                        metric_serving_amount: data.serving.metric_serving_amount,
                        metric_serving_unit: data.serving.metric_serving_unit,
                    }}
                    servings={servings}
                    size={160}
                />
            </View>

            <Text style={styles.label}>Food</Text>
            <GradientTextDisplay text={data.title} />

            <View style={styles.labelRow}>
                <Text style={styles.label}>Number of Servings</Text>
                <Text style={styles.labelMeta}>{servingText}</Text>
            </View>
            <GradientTextInput
                keyboardType="numeric"
                value={servingsText}
                onChangeText={setServingsText}
            />

            <Text style={styles.label}>Meal Type</Text>
            <Dropdown
                options={mealOptions}
                selectedValue={mealType}
                onSelect={setMealType}
            />

            <Text style={styles.label}>Recorded Date and Time</Text>
            <GradientTextDisplay
                text={recordedText}
            />

            <View style={styles.buttonSpacing} />
            <View style={styles.buttonRow}>
                <View style={styles.buttonItem}>
                    <Button
                        title="Cancel"
                        onPress={() => router.back()}
                        gradient={gradient.red as [string, string]}
                    />
                </View>
                <View style={styles.buttonItem}>
                    <Button
                        title={submitting ? "Saving..." : "Save"}
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        gradient={gradient.green as [string, string]}
                    />
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        backgroundColor: color.white,
    },

    // ...existing code...
    container: {
        padding: 16,
        paddingBottom: 40,
        backgroundColor: color.white,
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
    labelRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
    },
    labelMeta: {
        fontSize: 12,
        color: "#6B7280",
    },

    // spacing
    buttonSpacing: {
        height: 12,
    },

    // buttons
    buttonRow: {
        flexDirection: "row",
        gap: 12,
    },
    buttonItem: {
        flex: 1,
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
