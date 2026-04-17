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
import { useFocusEffect } from "expo-router"
import { getWatchMetrics } from "../../health/api/get-watch-data"
import type { WatchMetric } from "../../health/api/post-watch-data"

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
    const [latestWatchMetric, setLatestWatchMetric] = useState<WatchMetric | null>(null)
    const [watchLoading, setWatchLoading] = useState(false)

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

    const loadWatchMetric = useCallback(async () => {
        if (!accountId) return
        setWatchLoading(true)
        try {
            const result = await getWatchMetrics({
                profile_id: accountId,
                account_id: accountId,
                limit: 50,
            })
            const rows = result.rows
            if (rows && rows.length > 0) {
                // Pick the entry with the most recent measured_at
                const sorted = [...rows].sort(
                    (a, b) =>
                        new Date(b.measured_at).getTime() -
                        new Date(a.measured_at).getTime()
                )
                setLatestWatchMetric(sorted[0])
            } else {
                setLatestWatchMetric(null)
            }
        } catch {
            setLatestWatchMetric(null)
        } finally {
            setWatchLoading(false)
        }
    }, [accountId])

    useFocusEffect(
        useCallback(() => {
            loadData()
            loadWatchMetric()
        }, [loadData, loadWatchMetric])
    )

    // Build stacked bar chart data
    // Each bar: green = actual consumed after deducting burned, blue = burned calories, red = remaining gap
    const calsBurned = showAdjusted && latestWatchMetric
        ? Math.max(latestWatchMetric.calories_burned_kcal, 0)
        : 0

    const barData = data.map((item) => {
        const rawActual = item.calorie_actual_kcal
        const goal = item.calorie_goal_kcal
        // Net actual after deducting burned (floor at 0)
        const netActual = showAdjusted
            ? Math.max(rawActual - calsBurned, 0)
            : rawActual
        const burned = showAdjusted ? Math.min(calsBurned, rawActual) : 0
        const gap = Math.max(goal - netActual - burned, 0)
        const label = formatDateLabel(item.created_at)

        return {
            stacks: [
                {
                    value: netActual,
                    color: color.green,
                    marginBottom: 2,
                },
                ...(showAdjusted
                    ? [{ value: burned, color: "#60A5FA", marginBottom: 2 }]
                    : []),
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
                        barWidth={12}
                        spacing={22}
                        barBorderRadius={5}
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
                        <Text style={styles.legendText}>Net Consumed</Text>
                    </View>
                    {showAdjusted && (
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: "#60A5FA" }]} />
                            <Text style={styles.legendText}>Burned</Text>
                        </View>
                    )}
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
                    Account for calories burned (based on latest watch sync)
                </Text>
            </View>
            {showAdjusted && (
                <Text style={styles.watchNote}>
                    {watchLoading
                        ? "Loading watch data…"
                        : latestWatchMetric
                        ? `Latest sync: ${latestWatchMetric.calories_burned_kcal.toFixed(0)} kcal burned ≈ ${(latestWatchMetric.calories_burned_kcal / 9).toFixed(1)} g fat (${new Date(latestWatchMetric.measured_at).toLocaleDateString()})`
                        : "No watch sync data found. Please sync your watch first."}
                </Text>
            )}
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
    watchNote: {
        fontSize: 11,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 6,
        fontStyle: "italic",
    },
})