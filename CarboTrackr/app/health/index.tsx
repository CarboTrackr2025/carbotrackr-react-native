import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import BloodPressureChart from "../../features/health/components/BloodPressureChart";
import DateRangePicker from "../../shared/components/DateRangePicker";
import { Button } from "../../shared/components/Button";
import { router } from "expo-router";
import { color, gradient } from "../../shared/constants/colors";

import {
    getBloodPressureReport,
    type BpMeasurement,
} from "../../features/health/api/get-blood-pressures";

const PROFILE_ID = "e17fabf0-c9f2-4230-a091-12fcf18a3411";

// ✅ LOCAL date formatter (avoids UTC shift from toISOString)
const toYMDLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

// ✅ Ensure API range includes the whole day
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export default function BloodPressureIndexScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [measurements, setMeasurements] = useState<BpMeasurement[]>([]);

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const fetchMeasurements = useCallback(async () => {
        try {
            // ✅ clear stale chart while loading new range
            setMeasurements([]);

            const { measurements: cleaned } = await getBloodPressureReport({
                profileId: PROFILE_ID,
                startDate: startOfDay(startDate),
                endDate: endOfDay(endDate),
            });

            setMeasurements(cleaned);
        } catch (err: any) {
            console.log("Failed to fetch BP measurements", {
                message: err?.message,
                status: err?.response?.status,
                url: err?.config?.url,
                params: err?.config?.params,
                data: err?.response?.data,
            });
            Alert.alert("Could not load blood pressure history", "Please try again.");
        }
    }, [startDate, endDate]);

    // ✅ Initial load (mount)
    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchMeasurements();
            setLoading(false);
        })();
    }, [fetchMeasurements]);

    // ✅ Refetch every time you return to this screen (after adding an entry)
    useFocusEffect(
        useCallback(() => {
            fetchMeasurements();
        }, [fetchMeasurements])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMeasurements();
        setRefreshing(false);
    }, [fetchMeasurements]);

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Blood Pressure</Text>
                <Text style={styles.subTitle}>
                    {toYMDLocal(startDate)} → {toYMDLocal(endDate)}
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

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator />
                    <Text style={styles.loadingText}>Loading readings…</Text>
                </View>
            ) : (
                <>
                    <BloodPressureChart measurements={measurements} />

                    {measurements.length === 0 && (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyTitle}>No readings found</Text>
                            <Text style={styles.emptySub}>Try a wider date range, or add an entry.</Text>
                        </View>
                    )}
                </>
            )}

            <Button
                title="Log Blood Pressure"
                onPress={() => router.push("/health/add-blood-pressure")}
                gradient={gradient.green as [string, string]}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#fff" },
    content: { padding: 12, paddingBottom: 24 },

    headerRow: { marginBottom: 10 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
    subTitle: { marginTop: 2, fontSize: 12, color: "#6B7280" },

    loadingBox: {
        height: 180,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    loadingText: { color: "#6B7280", fontSize: 12 },

    emptyBox: {
        marginTop: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: color.white,
    },
    emptyTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 4 },
    emptySub: { fontSize: 12, color: "#6B7280" },
});
