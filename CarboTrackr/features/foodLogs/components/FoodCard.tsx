import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type FoodCardItem = {
    id: string;
    brand_name?: string | null;
    food_name: string;
    serving_description: string;
    calories: number;
};

export type FoodCardProps = FoodCardItem & {
    onAdd?: (item: FoodCardItem) => void;
};

export function FoodCard({
                             id,
                             brand_name,
                             food_name,
                             serving_description,
                             calories,
                             onAdd,
                         }: FoodCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.textWrap}>
                {/* Food name */}
                <Text
                    style={styles.foodName}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {food_name}
                </Text>

                {/* Brand (if exists) */}
                {brand_name ? (
                    <Text
                        style={styles.brand}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {brand_name}
                    </Text>
                ) : null}

                {/* Calories + serving */}
                <Text style={styles.subtitle}>
                    {calories} cal, {serving_description}
                </Text>
            </View>

            <Pressable
                onPress={() =>
                    onAdd?.({ id, brand_name, food_name, serving_description, calories })
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
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },

    textWrap: {
        flex: 1,
        marginRight: 12,
    },

    foodName: {
        fontSize: 16,        // smaller than before
        fontWeight: "600",
        color: "#111827",
        flexShrink: 1,       // prevents layout break
    },

    brand: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 2,
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
