import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { router } from "expo-router";

import { FoodCard, type FoodCardItem } from "../../features/foodLogs/components/FoodCard";
import { searchFoods } from "../../features/foodLogs/api/search-food";

export default function Index() {
    const [query] = useState("chicken breast");
    const [items, setItems] = useState<FoodCardItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function run() {
            try {
                setLoading(true);
                setErrorMsg(null);

                const result = await searchFoods(query);
                if (!mounted) return;

                setItems(result.items);
            } catch (err: any) {
                if (!mounted) return;
                setErrorMsg(err?.message ?? "Failed to search foods");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        run();
        return () => {
            mounted = false;
        };
    }, [query]);

    return (
        <View style={styles.container}>
            {loading && (
                <View style={styles.center}>
                    <ActivityIndicator />
                </View>
            )}

            {!loading && errorMsg && (
                <View style={styles.center}>
                    <Text style={styles.error}>{errorMsg}</Text>
                </View>
            )}

            {!loading && !errorMsg && (
                <FlatList<FoodCardItem>
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <FoodCard
                            {...item}
                            onAdd={() => {
                                // 🔥 Navigate to food detail screen
                                router.push({
                                    pathname: "./foodLogs/[food_id]",
                                    params: { food_id: item.food_id, serving_id: item.serving_id ?? "" },
                                });

                            }}
                        />
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 16,
    },
    listContent: {
        paddingBottom: 24,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    error: {
        color: "#B91C1C",
        fontSize: 14,
    },
});
