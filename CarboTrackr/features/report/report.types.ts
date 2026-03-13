export type CalorieDataPoint = {
    id: string
    profile_id: string
    calorie_goal_kcal: number
    calorie_actual_kcal: number
    created_at: string
}

export type CarbohydrateDataPoint = {
    id: string
    profile_id: string
    carbohydrate_goal_g: number
    carbohydrate_actual_g: number
    created_at: string
}

export type ReportDateRange = {
    startDate: Date
    endDate: Date
}