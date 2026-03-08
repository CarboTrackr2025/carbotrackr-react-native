import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { color, gradient } from "../../../shared/constants/colors";
import type { FoodLogForUI } from "../api/get-food-logs-by-account-id";

export type FoodLogCardProps = {
    item: FoodLogForUI;
    onPress?: (item: FoodLogForUI) => void;
    onDelete?: (item: FoodLogForUI) => void;
};

const mealTypeToGradient = (mealType: string): [string, string] => {
    const key = String(mealType ?? "").trim().toUpperCase();
    if (key === "BREAKFAST") return gradient.orange as [string, string];
    if (key === "LUNCH") return gradient.fuschia as [string, string];
    if (key === "SNACK") return gradient.caramel as [string, string];
    if (key === "DINNER") return gradient.indigo as [string, string];
    return gradient.green as [string, string];
};

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : Number(n || 0).toFixed(2));

export function FoodLogCard({ item, onPress, onDelete }: FoodLogCardProps) {
    const borderColors = mealTypeToGradient(item.meal_type);

    return (
        <LinearGradient
            colors={borderColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
        >
            <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => onPress?.(item)}
            >
                <View style={styles.parentCol}>
                    <View style={styles.topRow}>
                        <View style={styles.contentWrap}>
                            <Text style={styles.foodName} numberOfLines={2}>
                                {item.food_name}
                            </Text>

                            <View style={styles.metricsRow}>
                                <Text style={styles.caloriesText}>{fmt(item.calories_kcal)} kcal</Text>
                                <Text style={styles.carbsText}>Carbs {fmt(item.carbohydrates_g)}g</Text>
                                <Text style={styles.proteinText}>Proteins {fmt(item.protein_g)}g</Text>
                                <Text style={styles.fatText}>Fats {fmt(item.fat_g)}g</Text>
                            </View>
                        </View>

                        <Pressable
                            onPress={() => onDelete?.(item)}
                            hitSlop={12}
                            style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
                        >
                            <Ionicons name="trash" size={32} color={color.red} />
                        </Pressable>
                    </View>
                </View>
            </Pressable>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientBorder: {
        borderRadius: 16,
        padding: 2.5,
        marginVertical: 10,
    },
    card: {
        borderRadius: 14,
        backgroundColor: color.white,
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    pressed: {
        opacity: 0.92,
    },

    parentCol: {
        flexDirection: "column",
    },

    topRow: {
        flexDirection: "row",
        alignItems: "center", // aligned with delete button
        justifyContent: "space-between",
        columnGap: 4,
    },

    contentWrap: {
        flex: 1,
        minWidth: 0,
    },

    foodName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },

    metricsRow: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
    },

    caloriesText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
    },
    carbsText: {
        fontSize: 13,
        fontWeight: "700",
        color: color.green,
    },
    proteinText: {
        fontSize: 13,
        fontWeight: "700",
        color: color.blue,
    },
    fatText: {
        fontSize: 13,
        fontWeight: "700",
        color: color.yellow,
    },

    deleteBtn: {
        alignItems: "center",
        justifyContent: "center",
    },
    deleteBtnPressed: {
        opacity: 0.7,
    },
});