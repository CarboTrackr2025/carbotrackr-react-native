import { api } from "../../../shared/api"
import type { CalorieDataPoint, CarbohydrateDataPoint } from "../report.types"

type CalorieReportResult =
    | { success: true; data: CalorieDataPoint[] }
    | { success: false; message: string }

type CarbohydrateReportResult =
    | { success: true; data: CarbohydrateDataPoint[] }
    | { success: false; message: string }

export async function fetchCalorieReport(
    accountId: string,
    startDate: Date,
    endDate: Date
): Promise<CalorieReportResult> {
    try {
        const response = await api.get("/report/calories", {
            params: {
                accountId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
        })
        return { success: true, data: response.data.data }
    } catch (error: any) {
        const message =
            error?.response?.data?.message ?? "Failed to fetch calorie report."
        return { success: false, message }
    }
}

export async function fetchCarbohydrateReport(
    accountId: string,
    startDate: Date,
    endDate: Date
): Promise<CarbohydrateReportResult> {
    try {
        const response = await api.get("/report/carbohydrates", {
            params: {
                accountId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
        })
        return { success: true, data: response.data.data }
    } catch (error: any) {
        const message =
            error?.response?.data?.message ?? "Failed to fetch carbohydrate report."
        return { success: false, message }
    }
}