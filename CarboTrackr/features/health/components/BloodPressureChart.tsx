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
    return d
        .toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
        .replace(' ', '-');
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* =======================
   Status logic
======================= */

const evaluateBloodPressure = (
    systolic: number,
    diastolic: number
): BPStatus => {
    if (systolic < 90 || diastolic < 60) return 'LOW';
    if (systolic < 120 && diastolic < 80) return 'NORMAL';
    if (systolic >= 120 && systolic < 130 && diastolic < 80) return 'ELEVATED';
    if ((systolic >= 130 && systolic < 180) || (diastolic >= 80 && diastolic < 120))
        return 'HYPERTENSION';
    if (systolic >= 180 || diastolic >= 120) return 'CRISIS';
    return 'NORMAL';
};

/* =======================
   Color mapping
   solid = systolic
   light = diastolic
======================= */

const BP_COLORS: Record<
    BPStatus,
    { solid: string; light: string }
> = {
    LOW: {
        solid: color.blue,
        light: color['light-blue'],
    },
    NORMAL: {
        solid: color.green,
        light: color['light-green'],
    },
    ELEVATED: {
        solid: color.yellow,
        light: color['light-yellow'],
    },
    HYPERTENSION: {
        solid: color.red,
        light: color['light-red'],
    },
    CRISIS: {
        solid: color.red,
        light: color['light-red'],
    },
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
   Component
======================= */

export default function BloodPressureChart({ measurements = [] }: Props) {
    const sorted = useMemo(() => {
        return [...measurements]
            .filter(
                (m) =>
                    Number.isFinite(m.systolic_mmHg) &&
                    Number.isFinite(m.diastolic_mmHg) &&
                    !Number.isNaN(new Date(m.created_at).getTime())
            )
            .sort(
                (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
            );
    }, [measurements]);

    const toHeight = (v: number) => {
        const t = clamp01((v - Y_MIN) / (Y_MAX - Y_MIN));
        return Math.max(3, Math.round(t * PLOT_HEIGHT));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Blood Pressure</Text>

            <View style={styles.card}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.chart}>
                        <View style={styles.plotRow}>
                            {sorted.map((m) => {
                                const status = evaluateBloodPressure(
                                    m.systolic_mmHg,
                                    m.diastolic_mmHg
                                );

                                const { solid, light } = BP_COLORS[status];

                                return (
                                    <View key={m.id} style={styles.group}>
                                        <View style={styles.plotArea}>
                                            <View style={styles.barPair}>
                                                {/* Systolic = solid */}
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        {
                                                            height: toHeight(m.systolic_mmHg),
                                                            backgroundColor: solid,
                                                        },
                                                    ]}
                                                />

                                                {/* Diastolic = light */}
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        {
                                                            height: toHeight(m.diastolic_mmHg),
                                                            backgroundColor: light,
                                                        },
                                                    ]}
                                                />
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
                    <LegendItem color={color.red} label="Hypertension / Crisis" />
                    <LegendItem color={color.yellow} label="Elevated" />
                    <LegendItem color={color.green} label="Normal" />
                    <LegendItem color={color.blue} label="Low" />

                    {/* reading legend */}
                    <View style={{ width: '100%', marginTop: 6, flexDirection: 'row', gap: 26 }}>
                        <Text style={styles.legendText}>Darker = Systolic</Text>
                        <Text style={styles.legendText}>Lighter = Diastolic</Text>
                    </View>


                </View>
            </View>
        </View>
    );
}

/* =======================
   Legend helper
======================= */

const LegendItem = ({
                        color: bg,
                        label,
                    }: {
    color: string;
    label: string;
}) => (
    <View style={styles.legendItem}>
        <View style={[styles.legendSwatch, { backgroundColor: bg }]} />
        <Text style={styles.legendText}>{label}</Text>
    </View>
);

/* =======================
   Styles
======================= */

const styles = StyleSheet.create({
    container: { padding: 2, height: CHART_HEIGHT + 100 },

    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#111827',
    },

    card: {
        backgroundColor: color.white,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    scrollContent: { paddingRight: 6, paddingBottom: 4 },

    chart: {
        height: CHART_HEIGHT,
        justifyContent: 'flex-end',
    },

    plotRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 14,
    },

    group: {
        width: 56,
        alignItems: 'center',
    },

    plotArea: {
        height: PLOT_HEIGHT,
        justifyContent: 'flex-end',
    },

    barPair: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'flex-end',
    },

    bar: {
        width: 10,
        borderRadius: 6,
    },

    labelArea: {
        height: LABEL_HEIGHT,
        justifyContent: 'center',
    },

    xLabel: {
        fontSize: 10,
        color: '#6B7280',
        textAlign: 'center',
    },

    legend: {
        marginTop: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },

    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    legendSwatch: {
        width: 10,
        height: 10,
        borderRadius: 3,
    },

    legendText: {
        fontSize: 12,
        color: color.black,
    },
});
