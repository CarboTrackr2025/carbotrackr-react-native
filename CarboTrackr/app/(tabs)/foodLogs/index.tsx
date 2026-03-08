import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import DateRangePicker from "../../../shared/components/DateRangePicker";
import { Button } from "../../../shared/components/Button";
import { color, gradient } from "../../../shared/constants/colors";
import { getClerkUserId } from "../../../features/auth/auth.utils";

import {
    getFoodLogsByAccountId,
    type FoodLogForUI,
} from "../../../features/foodLogs/api/get-food-logs-by-account-id";
import { FoodLogCard } from "../../../features/foodLogs/components/FoodLogCard";

const toYMDLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export default function FoodLogsIndexScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [logs, setLogs] = useState<FoodLogForUI[]>([]);

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const fetchLogs = useCallback(async () => {
        try {
            setError("");

            const accountIdFromClerk = await getClerkUserId();
            if (!accountIdFromClerk) {
                throw new Error("User ID from Clerk Auth API not found");
            }

            const data = await getFoodLogsByAccountId(
                accountIdFromClerk,
                toYMDLocal(startDate),
                toYMDLocal(endDate)
            );

            setLogs(data);
        } catch (err: any) {
            setError(err?.message ?? "Failed to fetch food logs.");
        }
    }, [startDate, endDate]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchLogs();
            setLoading(false);
        })();
    }, [fetchLogs]);

    useFocusEffect(
        useCallback(() => {
            fetchLogs();
        }, [fetchLogs])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    }, [fetchLogs]);

    const onDeleteLocal = useCallback((item: FoodLogForUI) => {
        setLogs((prev) => prev.filter((x) => x.id !== item.id));
    }, []);

    return (
        <View style={styles.screen}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>Food Logs</Text>
                    <Text style={styles.subTitle}>
                        {toYMDLocal(startDate)} to {toYMDLocal(endDate)}
                    </Text>
                </View>

                <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(s, e) => {
                        setStartDate(s);
                        setEndDate(e);
                    }}
                />

                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: color.orange }]} />
                        <Text style={styles.legendText}>Breakfast</Text>
                    </View>

                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: color.fuschia }]} />
                        <Text style={styles.legendText}>Lunch</Text>
                    </View>

                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: color.caramel }]} />
                        <Text style={styles.legendText}>Snack</Text>
                    </View>

                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: color.indigo }]} />
                        <Text style={styles.legendText}>Dinner</Text>
                    </View>
                </View>

                {loading ? (

                    <View style={styles.loadingBox}>
                        <ActivityIndicator />
                        <Text style={styles.loadingText}>Loading food logs...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyTitle}>Could not load food logs</Text>
                        <Text style={styles.emptySub}>{error}</Text>
                    </View>
                ) : logs.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyTitle}>No food logs found</Text>
                        <Text style={styles.emptySub}>Try a wider date range, or add an entry.</Text>
                    </View>
                ) : (
                    logs.map((item) => (
                        <FoodLogCard
                            key={item.id}
                            item={item}
                            onPress={() => {}}
                            onDelete={onDeleteLocal}
                        />
                    ))
                )}
            </ScrollView>

            <View style={styles.stickyButtonWrap}>
                <Button
                    title="Search Food"
                    onPress={() => router.push("/foodLogs/search-food")}
                    gradient={gradient.green as [string, string]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: color.white,
    },
    scroll: {
        flex: 1,
    },
    content: {
        padding: 12,
        paddingBottom: 110,
    },

    headerRow: {
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    subTitle: {
        marginTop: 2,
        fontSize: 12,
        color: "#6B7280",
    },

    loadingBox: {
        minHeight: 180,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    loadingText: {
        color: "#6B7280",
        fontSize: 12,
    },

    emptyBox: {
        marginTop: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: color.white,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    emptySub: {
        fontSize: 12,
        color: "#6B7280",
    },

    stickyButtonWrap: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 16,
    },
    legendRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: "#4B5563",
        fontWeight: "600",
    },
});