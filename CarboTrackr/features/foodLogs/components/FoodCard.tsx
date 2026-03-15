import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type FoodCardItem = {
    id: string;

    food_id: string;
    serving_id: string | null;

    food_name: string; // already includes brand if available
    serving_description: string;
    metric: string; // "28.35 g"
    calories: string; // "255 cal"
};

export type FoodCardProps = FoodCardItem & {
    onAdd?: (item: FoodCardItem) => void;
};

export function FoodCard({
                             id,
                             food_id,
                             serving_id,
                             food_name,
                             serving_description,
                             metric,
                             calories,
                             onAdd,
                         }: FoodCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.textWrap}>
                <Text style={styles.foodName} numberOfLines={2} ellipsizeMode="tail">
                    {food_name}
                </Text>

                <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">
                    {calories}, {serving_description}
                    {metric ? ` • ${metric}` : ""}
                </Text>
            </View>

            <Pressable
                onPress={() =>
                    onAdd?.({
                        id,
                        food_id,
                        serving_id,
                        food_name,
                        serving_description,
                        metric,
                        calories,
                    })
                }
                hitSlop={12}
                style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.6 }]}
            >
                <Ionicons name="add" size={32} color="#111827" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 18,
        marginVertical: 10,
        borderWidth: 2.5,
        borderColor: "#D1D5DB", // simple gray border
    },

    textWrap: {
        flex: 1,
        marginRight: 12,
    },

    foodName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        flexShrink: 1,
    },

    subtitle: {
        fontSize: 14,
        color: "#374151",
        marginTop: 6,
    },

    addBtn: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
});