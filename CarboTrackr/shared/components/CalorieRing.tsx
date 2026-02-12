import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { gradient, color } from "../constants/colors";

type Props = {
    nutrition: {
        calories_kcal: number;
        carbs: { grams: number; kcal: number };
        protein: { grams: number; kcal: number };
        fat: { grams: number; kcal: number };

        metric_serving_amount: number; // ✅ flat
        metric_serving_unit: string;   // ✅ flat
    };
    servings?: number;
    size?: number;
    legendSide?: "right" | "bottom";
};



const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const clampPos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export const CalorieRing: React.FC<Props> = ({
                                                 nutrition,
                                                 servings = 1,
                                                 size = 220,
                                                 legendSide = "right",
                                             }) => {
    const s = toNum(servings) || 1;

    const carbsK = clampPos(toNum(nutrition.carbs.kcal) * s);
    const proteinK = clampPos(toNum(nutrition.protein.kcal) * s);
    const fatK = clampPos(toNum(nutrition.fat.kcal) * s);

    const carbsG = clampPos(toNum(nutrition.carbs.grams) * s);
    const proteinG = clampPos(toNum(nutrition.protein.grams) * s);
    const fatG = clampPos(toNum(nutrition.fat.grams) * s);

    const calories = clampPos(toNum(nutrition.calories_kcal) * s);

    const totalServingAmount = clampPos(toNum(nutrition.metric_serving_amount) * s);
    const servingUnit = String(nutrition.metric_serving_unit ?? "").trim();

    // Percentages based on kcal (more correct)
    const macroTotalK = carbsK + proteinK + fatK;
    const pct = (part: number) => (macroTotalK > 0 ? (part / macroTotalK) * 100 : 0);

    const radius = size / 2;
    const innerRadius = radius * 0.72;

    const chartData = useMemo(() => {
        return [
            {
                key: "fat",
                value: fatK,
                color: gradient.yellow[1],
                gradientCenterColor: gradient.yellow[0],
            },
            {
                key: "protein",
                value: proteinK,
                color: gradient.blue[1],
                gradientCenterColor: gradient.blue[0],
            },
            {
                key: "carbs",
                value: carbsK,
                color: gradient.green[1],
                gradientCenterColor: gradient.green[0],
            },
        ].filter((x) => x.value > 0);
    }, [fatK, proteinK, carbsK]);

    const legendItems = useMemo(() => {
        return [
            { key: "fat", label: "Fats", pct: pct(fatK), grams: fatG, dot: gradient.yellow[1] },
            { key: "protein", label: "Protein", pct: pct(proteinK), grams: proteinG, dot: gradient.blue[1] },
            { key: "carbs", label: "Carbs", pct: pct(carbsK), grams: carbsG, dot: gradient.green[1] },
        ];
    }, [fatK, proteinK, carbsK, fatG, proteinG, carbsG, macroTotalK]);

    const dynamic = getDynamicStyles(radius);

    return (
        <View style={[styles.root, legendSide === "right" ? styles.row : styles.col]}>
            {/* Chart */}
            <View style={[styles.wrapper, { width: size, height: size }]}>
                <PieChart
                    donut
                    showGradient
                    radius={radius}
                    innerRadius={innerRadius}
                    data={chartData}
                    strokeWidth={Math.max(2, radius * 0.05)}
                    strokeColor={color.white}
                    innerCircleColor={color.white}
                    centerLabelComponent={() => (
                        <View style={styles.center}>
                            <Text
                                style={dynamic.calories}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {Math.round(calories)}
                            </Text>
                            <Text style={dynamic.label}>Calories</Text>

                            {/* ✅ label depends on metric unit */}
                            <Text style={dynamic.sub} numberOfLines={1}>
                                ({Math.round(totalServingAmount * 100) / 100} {servingUnit || ""})
                            </Text>
                        </View>
                    )}
                />
            </View>

            {/* Legend */}
            <View style={legendSide === "right" ? styles.legendRight : styles.legendBottom}>
                {legendItems.map((item) => (
                    <View key={item.key} style={styles.legendRow}>
                        <View style={[styles.dot, { backgroundColor: item.dot }]} />
                        <Text style={styles.legendText} numberOfLines={2}>
                            {item.label}, {Math.round(item.pct)}%, {Math.round(item.grams * 10) / 10} g
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        alignItems: "center",
        justifyContent: "center",
    },
    row: {
        flexDirection: "row",
    },
    col: {
        flexDirection: "column",
    },

    wrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
    center: {
        alignItems: "center",
        justifyContent: "center",
    },

    legendRight: {
        marginLeft: 16,
        justifyContent: "center",
    },
    legendBottom: {
        marginTop: 12,
        width: "100%",
        alignItems: "center",
    },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    dot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        marginRight: 10,
    },
    legendText: {
        fontSize: 16,
        color: color.black,
        fontStyle: "italic",
    },
});

const getDynamicStyles = (radius: number) =>
    StyleSheet.create({
        calories: {
            fontSize: Math.max(18, radius * 0.42),
            fontWeight: "800",
            color: color.black,
            lineHeight: Math.max(20, radius * 0.46),
        },
        label: {
            fontSize: Math.max(14, radius * 0.18),
            fontWeight: "500",
            color: color.black,
            marginTop: 2,
        },
        sub: {
            fontSize: Math.max(12, radius * 0.13),
            color: "#555",
            marginTop: 2,
        },
    });
