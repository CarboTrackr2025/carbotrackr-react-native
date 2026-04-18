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
import { fetchCarbohydrateReport } from "../api/report.api"
import { formatDateLabel, formatTimeLabel } from "../report.utils"
import type { CarbohydrateDataPoint } from "../report.types"
import { color, gradient } from "../../../shared/constants/colors"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"

const CARD_BORDER_WIDTH = 2.5
const CARD_RADIUS = 12
export function CarbohydrateReportScreen() {
    const { user } = useUser()
    const router = useRouter()

    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(today.getDate() - 6)

    const [startDate, setStartDate] = useState(weekAgo)
    const [endDate, setEndDate] = useState(today)
    const [data, setData] = useState<CarbohydrateDataPoint[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAdjusted, setShowAdjusted] = useState(false)

    const accountId = user?.id ?? ""

    const loadData = useCallback(async () => {
        if (!accountId) return
        setLoading(true)
        setError(null)

        const result = await fetchCarbohydrateReport(accountId, startDate, endDate)
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

    const barData = data.map((item) => {
        const actual = Number(item.carbohydrate_actual_g)
        const goal = Number(item.carbohydrate_goal_g)
        const gap = Math.max(goal - actual, 0)
        const dateLabel = formatDateLabel(item.created_at)
        const timeLabel = formatTimeLabel(item.created_at)

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
            label: `${dateLabel} ${timeLabel}`,
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
            <Text style={styles.heading}>Carbohydrate Consumption Graph</Text>

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
                    No carbohydrate data found for this date range.
                </Text>
            ) : (
                <LinearGradient
                    colors={gradient.green as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardBorder}
                >
                    <View style={styles.card}>
                        <View style={styles.chartWrapper}>
                            <BarChart
                                stackData={barData}
                                barWidth={30}
                                spacing={40}
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
                    </View>
                </LinearGradient>
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
                    Show graph with actual carbohydrates consumed and daily carbohydrates burned from walking
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
    cardBorder: {
        borderRadius: CARD_RADIUS,
        padding: CARD_BORDER_WIDTH,
        overflow: "hidden",
        marginTop: 12,
        marginBottom: 16,
    },
    card: {
        backgroundColor: color.white,
        borderRadius: CARD_RADIUS - CARD_BORDER_WIDTH,
        padding: 8,
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