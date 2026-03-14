import React, { useState, useEffect, useCallback } from "react"
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Switch,
} from "react-native"
import { BarChart } from "react-native-gifted-charts"
import { useUser } from "@clerk/clerk-expo"
import { Header } from "../../../shared/components/Header"
import DateRangePicker from "../../../shared/components/DateRangePicker"
import { fetchCalorieReport } from "../api/report.api"
import { formatDateLabel } from "../report.utils"
import type { CalorieDataPoint } from "../report.types"
import { color } from "../../../shared/constants/colors"
import { useRouter } from "expo-router"

export function CalorieReportScreen() {
    const { user } = useUser()
    const router = useRouter()

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

    useEffect(() => {
        loadData()
    }, [loadData])

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
            {/* ── HEADER ── */}
            <Header onFAQ={() => router.push("/faqs")} />

            {/* ── HEADLINE ── */}
            <Text style={styles.heading}>Calorie Consumption Graph</Text>

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
                <Text style={styles.errorText}>{error}</Text>
            ) : data.length === 0 ? (
                <Text style={styles.emptyText}>
                    No calorie data found for this date range.
                </Text>
            ) : (
                <View style={styles.chartWrapper}>
                    <BarChart
                        stackData={barData}
                        barWidth={28}
                        spacing={16}
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
        fontSize: 20,
        fontWeight: "700",
        color: color.black,
        textAlign: "center",
        marginBottom: 20,
    },
    chartWrapper: {
        marginTop: 12,
        marginBottom: 16,
        alignItems: "center",
    },
    loader: {
        marginTop: 40,
    },
    errorText: {
        color: color.red,
        fontSize: 13,
        textAlign: "center",
        marginTop: 20,
    },
    emptyText: {
        color: "#6B7280",
        fontSize: 13,
        textAlign: "center",
        marginTop: 20,
    },
    legendRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 20,
        marginBottom: 16,
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
        alignItems: "center",
        gap: 10,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 12,
        color: "#6B7280",
        lineHeight: 18,
    },
    axisLabel: {
        fontSize: 10,
        color: "#6B7280",
    },
})