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
    };
    servings?: number;
    size?: number;
};

const toNum = (v: any) =>
    Number.isFinite(Number(v)) ? Number(v) : 0;

export const CalorieRing: React.FC<Props> = ({
                                                 nutrition,
                                                 servings = 1,
                                                 size = 160,
                                             }) => {
    const s = toNum(servings) || 1;

    const carbsK = toNum(nutrition.carbs.kcal) * s;
    const proteinK = toNum(nutrition.protein.kcal) * s;
    const fatK = toNum(nutrition.fat.kcal) * s;

    const calories = toNum(nutrition.calories_kcal) * s;

    const totalGrams =
        toNum(nutrition.carbs.grams) * s +
        toNum(nutrition.protein.grams) * s +
        toNum(nutrition.fat.grams) * s;

    const radius = size / 2;
    const innerRadius = radius * 0.72;

    const dynamicStyles = getDynamicStyles(radius);

    const data = useMemo(() => {
        return [
            {
                value: fatK,
                color: gradient.yellow[1],
                gradientCenterColor: gradient.yellow[0],
            },
            {
                value: proteinK,
                color: gradient.blue[1],
                gradientCenterColor: gradient.blue[0],
            },
            {
                value: carbsK,
                color: gradient.green[1],
                gradientCenterColor: gradient.green[0],
            },
        ].filter((x) => x.value > 0);
    }, [fatK, proteinK, carbsK]);

    return (
        <View style={[styles.wrapper, { width: size, height: size }]}>
            <PieChart
                donut
                showGradient
                radius={radius}
                innerRadius={innerRadius}
                data={data}
                strokeWidth={radius * 0.05}
                strokeColor={color.white}
                innerCircleColor={color.white}
                centerLabelComponent={() => (
                    <View style={styles.center}>
                        <Text style={dynamicStyles.calories}>
                            {Math.round(calories)}
                        </Text>
                        <Text style={dynamicStyles.label}>
                            kCal
                        </Text>
                        <Text style={dynamicStyles.sub}>
                            ({Math.round(totalGrams)} grams)
                        </Text>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
    center: {
        alignItems: "center",
        justifyContent: "center",
    },
});

const getDynamicStyles = (radius: number) =>
    StyleSheet.create({
        calories: {
            fontSize: 24,
            fontWeight: "800",
            color: color.black,
        },
        label: {
            fontSize: 24,
            fontWeight: "500",
            color: color.black,
        },
        sub: {
            fontSize: 14,
            color: "#555",
        },
    });
