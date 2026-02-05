// app/(main)/health/blood-pressure/index.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import axios from 'axios';

import BloodPressureChart from '../../features/health/components/BloodPressureChart';
import { API_BASE_URL } from '../../shared/api';
import { color } from '../../shared/constants/colors';

type BpMeasurement = {
    id: string;
    systolic_mmHg: number;
    diastolic_mmHg: number;
    created_at: string;
};

const PROFILE_ID = 'e17fabf0-c9f2-4230-a091-12fcf18a3411';

// ✅ Date range for now (replace later with a picker)
const START_DATE = '2026-02-02';
const END_DATE = '2026-02-28';

// If backend returns array directly or wrapped
type GetBloodPressureResponse =
    | BpMeasurement[]
    | {
    data?: BpMeasurement[];
    measurements?: BpMeasurement[];
    items?: BpMeasurement[];
};

const extractMeasurements = (payload: GetBloodPressureResponse): any[] => {
    if (Array.isArray(payload)) return payload;
    return (payload?.data ?? payload?.measurements ?? payload?.items ?? []) as any[];
};

const normalizeMeasurement = (m: any): BpMeasurement | null => {
    const created =
        m?.created_at ??
        m?.recorded_at ??
        m?.timestamp ??
        m?.date ??
        null;

    const systolic = Number(m?.systolic_mmHg ?? m?.systolic ?? m?.systolic_value);
    const diastolic = Number(m?.diastolic_mmHg ?? m?.diastolic ?? m?.diastolic_value);

    const createdAt = typeof created === 'string' ? created : null;
    if (!Number.isFinite(systolic) || !Number.isFinite(diastolic) || !createdAt) return null;

    const t = new Date(createdAt).getTime();
    if (Number.isNaN(t)) return null;

    return {
        id: String(m?.id ?? m?._id ?? `${t}-${systolic}-${diastolic}`),
        systolic_mmHg: systolic,
        diastolic_mmHg: diastolic,
        created_at: createdAt,
    };
};

export default function BloodPressureIndexScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [measurements, setMeasurements] = useState<BpMeasurement[]>([]);

    const fetchMeasurements = useCallback(async () => {
        try {
            // ✅ Your exact Node route:
            // /health/:profileId/blood-pressure/report?start_date=...&end_date=...
            const url = `${API_BASE_URL}/health/${PROFILE_ID}/blood-pressure/report`;

            console.log('GET BP URL =>', url, 'params =>', {
                start_date: START_DATE,
                end_date: END_DATE,
            });

            const res = await axios.get<GetBloodPressureResponse>(url, {
                params: {
                    start_date: START_DATE,
                    end_date: END_DATE,
                },
            });

            const raw = extractMeasurements(res.data);

            const cleaned = raw
                .map(normalizeMeasurement)
                .filter((x): x is BpMeasurement => x !== null)
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            setMeasurements(cleaned);
        } catch (err: any) {
            console.log('BP GET failed', {
                message: err?.message,
                status: err?.response?.status,
                url: err?.config?.url,
                params: err?.config?.params,
                data: err?.response?.data,
            });
            Alert.alert('Could not load blood pressure history', 'Please try again.');
        }
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchMeasurements();
            setLoading(false);
        })();
    }, [fetchMeasurements]);

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
                    {START_DATE} → {END_DATE}
                </Text>
            </View>

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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 12, paddingBottom: 24 },

    headerRow: { marginBottom: 10 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    subTitle: { marginTop: 2, fontSize: 12, color: '#6B7280' },

    loadingBox: {
        height: 180,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loadingText: { color: '#6B7280', fontSize: 12 },

    emptyBox: {
        marginTop: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: color.white,
    },
    emptyTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
    emptySub: { fontSize: 12, color: '#6B7280' },
});
