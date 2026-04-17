import React, { useState, useCallback } from "react"
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Switch,
    useWindowDimensions,
} from "react-native"
import { BarChart } from "react-native-gifted-charts"
import { useUser } from "@clerk/clerk-expo"
import DateRangePicker from "../../../shared/components/DateRangePicker"
import { fetchCalorieReport } from "../api/report.api"
import { formatDateLabel } from "../report.utils"
import type { CalorieDataPoint } from "../report.types"
import { color } from "../../../shared/constants/colors"
import { useRouter } from "expo-router"
import { useFocusEffect } from "expo-router"

export function CalorieReportScreen() {
    const { user } = useUser()
    const router = useRouter()
    const { width } = useWindowDimensions()
    const chartWidth = width - 48 // 24px horizontal padding each side

    // Default date range: last 7 days
    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(today.getDate() - 6)

    const [startDate, setStartDate] = useState(weekAgo)
    const [endDate, setEndDate] = useState(today)
    const [data, setData] = useState<CalorieDataPoint[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAdjusted, setShowAdjusted] = useState(false)

    const accountId = user?.id ?? ""

    const loadData = useCallback(async () => {
        if (!accountId) return
        setLoading(true)
        setError(null)

        const result = await fetchCalorieReport(accountId, startDate, endDate)
        setLoading(false)

        if (result.success) {
            setData(result.data)
        } else {
            setError(result.message)
        }
    }, [accountId, startDate, endDate])

    // useEffect(() => {
    //     loadData()
    // }, [loadData])

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [loadData])
    )

    // Build stacked bar chart data
    // Each bar: green = actual consumed, red = remaining gap to goal
    const barData = data.map((item) => {
        const actual = item.calorie_actual_kcal
        const goal = item.calorie_goal_kcal
        const gap = Math.max(goal - actual, 0)
        const label = formatDateLabel(item.created_at)

        return {
            stacks: [
                {
                    value: actual,
                    color: color.green,
                    marginBottom: 2,
                },
                {
                    value: gap,
                    color: color["light-red"],
                },
            ],
            label,
        }
    })

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.container}
            nestedScrollEnabled
        >
            {/* ── HEADLINE ── */}
            <Text style={styles.heading}>Calorie Consumption</Text>
            <Text style={styles.subheading}>Track your daily intake vs. goal</Text>

            {/* ── DATE RANGE PICKER ── */}
            <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={(start, end) => {
                    setStartDate(start)
                    setEndDate(end)
                }}
            />

            {/* ── GRAPH ── */}
            {loading ? (
                <ActivityIndicator
                    size="large"
                    color={color.green}
                    style={styles.loader}
                />
            ) : error ? (
                <View style={styles.messageBox}>
                    <Text style={styles.messageIcon}>⚠️</Text>
                    <Text style={styles.errorText}>Couldn't load your calorie data right now. Try refreshing or check your connection.</Text>
                </View>
            ) : data.length === 0 ? (
                <View style={styles.messageBox}>
                    <Text style={styles.messageIcon}>📭</Text>
                    <Text style={styles.emptyText}>
                        No calorie entries logged for this period. Start logging meals to see your progress!
                    </Text>
                </View>
            ) : (
                <View style={styles.chartWrapper}>
                    <BarChart
                        stackData={barData}
                        width={chartWidth - 40}
                        barWidth={28}
                        spacing={Math.max(8, (chartWidth - 40 - barData.length * 28) / Math.max(barData.length - 1, 1))}
                        barBorderRadius={6}
                        roundedTop
                        hideRules
                        xAxisLabelTextStyle={styles.axisLabel}
                        yAxisTextStyle={styles.axisLabel}
                        noOfSections={4}
                        yAxisThickness={0}
                        xAxisThickness={1}
                        xAxisColor="#E5E7EB"
                        isAnimated
                    />
                </View>
            )}

            {/* ── LEGEND ── */}
            {!loading && data.length > 0 && (
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: color.green }]} />
                        <Text style={styles.legendText}>Actual Consumed</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: color["light-red"] }]} />
                        <Text style={styles.legendText}>Remaining to Goal</Text>
                    </View>
                </View>
            )}

            {/* ── CHECKBOX ── */}
            <View style={styles.checkboxRow}>
                <Switch
                    value={showAdjusted}
                    onValueChange={setShowAdjusted}
                    trackColor={{
                        false: "#E5E7EB",
                        true: color["light-green"],
                    }}
                    thumbColor={showAdjusted ? color.green : "#9CA3AF"}
                />
                <Text style={styles.checkboxLabel}>
                    Show graph with actual calories consumed and daily calories burned from walking
                </Text>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: color.white,
    },
    container: {
        padding: 24,
        paddingBottom: 40,
    },
    heading: {
        fontSize: 22,
        fontWeight: "700",
        color: color.black,
        marginBottom: 4,
    },
    subheading: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 20,
    },
    chartWrapper: {
        marginTop: 12,
        marginBottom: 20,
        alignItems: "center",
        width: "100%",
    },
    loader: {
        marginTop: 60,
    },
    messageBox: {
        alignItems: "center",
        paddingVertical: 40,
        paddingHorizontal: 16,
        gap: 10,
    },
    messageIcon: {
        fontSize: 36,
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
    emptyText: {
        color: "#6B7280",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
    legendRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 20,
        marginBottom: 20,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: "#6B7280",
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        marginTop: 8,
        paddingHorizontal: 4,
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        padding: 12,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 13,
        color: "#6B7280",
        lineHeight: 20,
    },
    axisLabel: {
        fontSize: 10,
        color: "#6B7280",
    },
})