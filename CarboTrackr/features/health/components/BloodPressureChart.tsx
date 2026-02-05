// CarboTrackr/features/health/components/BloodPressureChart.tsx
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { color } from '../../../shared/constants/colors';

/* =======================
   Types
======================= */

type BpMeasurement = {
    id: string;
    systolic_mmHg: number;
    diastolic_mmHg: number;
    created_at: string;
};

type Props = {
    measurements?: BpMeasurement[];
};

type BPStatus = 'LOW' | 'NORMAL' | 'ELEVATED' | 'HYPERTENSION' | 'CRISIS';

/* =======================
   Utils
======================= */

const formatLabelMMMdd = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).replace(' ', '-');
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const evaluateBloodPressure = (systolic: number, diastolic: number): BPStatus => {
    // 1️⃣ LOW
    if (systolic < 90 || diastolic < 60) return 'LOW';
    // 2️⃣ NORMAL
    if (systolic < 120 && diastolic < 80) return 'NORMAL';
    // 3️⃣ ELEVATED
    if (systolic >= 120 && systolic < 130 && diastolic < 80) return 'ELEVATED';
    // 4️⃣ HYPERTENSION (Stage 1 & 2)
    if ((systolic >= 130 && systolic < 180) || (diastolic >= 80 && diastolic < 120)) return 'HYPERTENSION';
    // 5️⃣ CRISIS
    if (systolic >= 180 || diastolic >= 120) return 'CRISIS';
    return 'NORMAL';
};

const BP_COLORS: Record<BPStatus, string> = {
    LOW: color.blue,
    NORMAL: color.green,
    ELEVATED: color.yellow,
    HYPERTENSION: color.red,
    CRISIS: color['light-red'],
};

/* =======================
   Chart constants
======================= */

const PLOT_HEIGHT = 140;
const LABEL_HEIGHT = 24;
const CHART_HEIGHT = PLOT_HEIGHT + LABEL_HEIGHT;
const Y_MIN = 20;
const Y_MAX = 200;

/* =======================
   Dummy data
======================= */

const dummyMeasurements: BpMeasurement[] = [
    { id: 'bp-1', systolic_mmHg: 119, diastolic_mmHg: 79, created_at: '2026-02-01T08:00:00.000Z' },
    { id: 'bp-2', systolic_mmHg: 128, diastolic_mmHg: 84, created_at: '2026-02-03T08:00:00.000Z' },
    { id: 'bp-3', systolic_mmHg: 135, diastolic_mmHg: 88, created_at: '2026-02-06T08:00:00.000Z' },
    { id: 'bp-4', systolic_mmHg: 125, diastolic_mmHg: 82, created_at: '2026-02-10T08:00:00.000Z' },
    { id: 'bp-5', systolic_mmHg: 140, diastolic_mmHg: 90, created_at: '2026-02-13T08:00:00.000Z' },
    { id: 'bp-6', systolic_mmHg: 60, diastolic_mmHg: 30, created_at: '2026-02-15T08:00:00.000Z' },
];

/* =======================
   Component
======================= */

export default function BloodPressureChart({ measurements }: Props) {
    const source = measurements?.length ? measurements : dummyMeasurements;

    const sorted = useMemo(() => {
        return [...source]
            .filter(
                (m) =>
                    Number.isFinite(m.systolic_mmHg) &&
                    Number.isFinite(m.diastolic_mmHg) &&
                    !Number.isNaN(new Date(m.created_at).getTime())
            )
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [source]);

    const toHeight = (v: number) => {
        const t = clamp01((v - Y_MIN) / (Y_MAX - Y_MIN));
        return Math.max(2, Math.round(t * PLOT_HEIGHT));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Blood Pressure</Text>

            <View style={styles.card}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.chart}>
                        <View style={styles.plotRow}>
                            {sorted.map((m) => {
                                const status = evaluateBloodPressure(m.systolic_mmHg, m.diastolic_mmHg);
                                const barColor = BP_COLORS[status];

                                return (
                                    <View key={m.id} style={styles.group}>
                                        <View style={styles.plotArea}>
                                            <View style={styles.barPair}>
                                                <View style={[styles.bar, { height: toHeight(m.systolic_mmHg), backgroundColor: barColor }]} />
                                                <View style={[styles.bar, { height: toHeight(m.diastolic_mmHg), backgroundColor: barColor }]} />
                                            </View>
                                        </View>

                                        <View style={styles.labelArea}>
                                            <Text style={styles.xLabel} numberOfLines={1}>
                                                {formatLabelMMMdd(m.created_at)}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                {/* Legend */}
                <View style={styles.legend}>
                    <LegendItem color={BP_COLORS.CRISIS} label="Hypertension / Crisis" />
                    <LegendItem color={BP_COLORS.ELEVATED} label="Elevated" />
                    <LegendItem color={BP_COLORS.NORMAL} label="Normal" />
                    <LegendItem color={BP_COLORS.LOW} label="Low" />
                </View>
            </View>
        </View>
    );
}

/* =======================
   Legend helper
======================= */

const LegendItem = ({ color: bg, label }: { color: string; label: string }) => (
    <View style={styles.legendItem}>
        <View style={[styles.legendSwatch, { backgroundColor: bg }]} />
        <Text style={styles.legendText}>{label}</Text>
    </View>
);

/* =======================
   Styles
======================= */

const styles = StyleSheet.create({
    container: { padding: 2, height: CHART_HEIGHT + 90 },
    title: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#111827' },
    card: { backgroundColor: color.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    scrollContent: { paddingRight: 6, paddingBottom: 4 },
    chart: { height: CHART_HEIGHT, justifyContent: 'flex-end' },
    plotRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
    group: { width: 56, alignItems: 'center' },
    plotArea: { height: PLOT_HEIGHT, justifyContent: 'flex-end' },
    barPair: { flexDirection: 'row', gap: 6, alignItems: 'flex-end' },
    bar: { width: 10, borderRadius: 6 },
    labelArea: { height: LABEL_HEIGHT, justifyContent: 'center' },
    xLabel: { fontSize: 10, color: '#6B7280', textAlign: 'center' },
    legend: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendSwatch: { width: 10, height: 10, borderRadius: 3 },
    legendText: { fontSize: 12, color: color.black },
});
