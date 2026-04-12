import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import DateRangePicker from "../../../shared/components/DateRangePicker";
import { Button } from "../../../shared/components/Button";
import { color, gradient } from "../../../shared/constants/colors";
import { useAuth } from "@clerk/clerk-expo";
import {
    getFoodLogsByAccountId,
    type FoodLogForUI,
} from "../../../features/foodLogs/api/get-food-logs-by-account-id";
import { deleteFoodLog } from "../../../features/foodLogs/api/delete-food-log";
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
    const [deleteTarget, setDeleteTarget] = useState<FoodLogForUI | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const { userId } = useAuth();

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const fetchLogs = useCallback(async () => {
        try {
            setError("");
            const accountIdFromClerk = userId;
            if (!accountIdFromClerk) throw new Error("User ID from Clerk Auth API not found");

            const data = await getFoodLogsByAccountId(
                accountIdFromClerk,
                toYMDLocal(startDate),
                toYMDLocal(endDate)
            );
            setLogs(data);
        } catch (err: any) {
            setError(err?.message ?? "Failed to fetch food logs.");
        }
    }, [startDate, endDate, userId]);

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

    const closeDeleteModal = useCallback(() => {
        if (deleteSubmitting) return;
        setDeleteModalVisible(false);
        setDeleteTarget(null);
    }, [deleteSubmitting]);

    const confirmDelete = useCallback(async () => {
        if (!deleteTarget) return;

        try {
            setDeleteSubmitting(true);
            await deleteFoodLog(deleteTarget.id);
            setDeleteModalVisible(false);
            setDeleteTarget(null);
            await fetchLogs();
            Alert.alert("Deleted", "Food log deleted successfully.");
        } catch (err: any) {
            Alert.alert(
                "Delete failed",
                err?.message ?? "Food log could not be deleted. Please try again."
            );
        } finally {
            setDeleteSubmitting(false);
        }
    }, [deleteTarget, fetchLogs]);

    const onDelete = useCallback((item: FoodLogForUI) => {
        setDeleteTarget(item);
        setDeleteModalVisible(true);
    }, []);

    return (
        <View style={styles.screen}>
            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeDeleteModal}
            >
                <View style={styles.modalOverlay}>
                    <LinearGradient
                        colors={gradient.green as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalGradientCard}
                    >
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Delete food log?</Text>
                            <Text style={styles.modalBody}>
                                {`Are you sure you want to delete "${deleteTarget?.food_name ?? "this food log"}"?`}
                            </Text>

                            <View style={styles.modalActions}>
                                <LinearGradient
                                    colors={gradient.green as [string, string]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.modalButton, styles.cancelGradientBorder]}
                                >
                                    <Pressable
                                        style={styles.cancelButton}
                                        onPress={closeDeleteModal}
                                        disabled={deleteSubmitting}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </Pressable>
                                </LinearGradient>

                                <Pressable
                                    style={styles.modalButton}
                                    onPress={confirmDelete}
                                    disabled={deleteSubmitting}
                                >
                                    <LinearGradient
                                        colors={gradient.red as [string, string]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.modalButtonGradient}
                                    >
                                        <Text style={styles.modalButtonText}>
                                            {deleteSubmitting ? "Deleting..." : "Delete"}
                                        </Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </Modal>

            <FlatList
                data={!loading && !error ? logs : []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <FoodLogCard item={item} onPress={() => {}} onDelete={onDelete} />
                )}
                contentContainerStyle={[
                    styles.content,
                    !loading && !error && logs.length === 0 && styles.contentWhenEmpty,
                ]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={
                    <View>

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

                        {loading && (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator />
                                <Text style={styles.loadingText}>Loading food logs...</Text>
                            </View>
                        )}

                        {!loading && !!error && (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyTitle}>Could not load food logs</Text>
                                <Text style={styles.emptySub}>{error}</Text>
                            </View>
                        )}

                    </View>
                }
                ListEmptyComponent={
                    !loading && !error ? (
                        <View style={styles.noDataWrap}>
                            <Text style={styles.noDataText}>
                                No food logs found. Try a wide range, or search food to add an entry.
                            </Text>
                        </View>
                    ) : null
                }
            />

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
    screen: { flex: 1, backgroundColor: color.white },
    content: { padding: 12, paddingBottom: 110 },
    contentWhenEmpty: { flexGrow: 1 },

    headerRow: { marginBottom: 10 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
    subTitle: { marginTop: 2, fontSize: 12, color: "#6B7280" },

    legendRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 10 },
    legendItem: { flexDirection: "row", alignItems: "center" },
    legendDot: { width: 10, height: 10, borderRadius: 999, marginRight: 6 },
    legendText: { fontSize: 12, color: "#4B5563", fontWeight: "600" },

    loadingBox: {
        minHeight: 180,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 10,
    },
    loadingText: { color: "#6B7280", fontSize: 12 },

    emptyBox: {
        marginTop: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: color.white,
        marginBottom: 10,
    },
    emptyTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 4 },
    emptySub: { fontSize: 12, color: "#6B7280" },

    noDataWrap: {
        flex: 1,
        minHeight: 220,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    noDataText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    modalGradientCard: {
        width: "100%",
        maxWidth: 360,
        borderRadius: 16,
        padding: 4,
        overflow: "hidden",
    },
    modalCard: {
        width: "100%",
        backgroundColor: color.white,
        borderRadius: 12,
        padding: 20,
        alignItems: "center",
        gap: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: color.black,
        textAlign: "center",
    },
    modalBody: {
        fontSize: 14,
        color: "#444",
        textAlign: "center",
        lineHeight: 20,
    },
    modalActions: {
        marginTop: 8,
        width: "100%",
        flexDirection: "row",
        gap: 10,
    },
    modalButton: {
        flex: 1,
        borderRadius: 10,
        overflow: "hidden",
    },
    modalButtonGradient: {
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    modalButtonText: {
        color: color.white,
        fontWeight: "600",
    },
    cancelGradientBorder: {
        padding: 2,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: color.white,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 18,
    },
    cancelButtonText: {
        color: "#374151",
        fontWeight: "600",
    },

    stickyButtonWrap: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 16,
    },
});