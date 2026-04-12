import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { router } from "expo-router";

import { FoodCard, type FoodCardItem } from "../../../features/foodLogs/components/FoodCard";
import { searchFoods } from "../../../features/foodLogs/api/search-food";
import { SearchTextInput } from "../../../shared/components/SearchTextInput";

export default function SearchFoodScreen() {
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<FoodCardItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const q = query.trim();

        // Do not call API for empty input
        if (!q) {
            setItems([]);
            setErrorMsg(null);
            setLoading(false);
            return;
        }

        async function run() {
            try {
                setLoading(true);
                setErrorMsg(null);

                const result = await searchFoods(q);
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
            <View style={styles.searchContainer}>
                <SearchTextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search foods..."
                    containerStyle={styles.searchInput}
                />
                <Text style={styles.disclaimer}>
                    Disclaimer: Some foods may not be searchable due to the food database’s limitations, and it may not fully capture every food accurately.
                </Text>
            </View>

            {loading && (
                <View style={styles.center}>
                    <ActivityIndicator />
                </View>
            )}

            {!loading && !errorMsg && query.trim() === "" && (
                <View style={styles.center}>
                    <Text style={styles.hint}>Start typing to search for foods</Text>
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
                                    pathname: "/(tabs)/foodLogs/[food_id]",
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
        backgroundColor: "#FFFFFF",
        flexDirection: "column",
    },
    searchContainer: {
        padding: 12,
    },
    listContent: {
        padding: 12,
        paddingBottom: 24,
    },
    searchInput: {
        marginBottom: 0,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    error: {
        color: "#B91C1C",
        fontSize: 14,
    },
    hint: {
        color: "#6B7280",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
    disclaimer: {
        marginTop: 8,
        color: "#6B7280",
        fontSize: 12,
        lineHeight: 16,
        textAlign: "center",
    },
});
