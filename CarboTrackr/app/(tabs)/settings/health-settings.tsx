import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import HealthSettingsForm, {
    SaveHealthSettingsInput,
} from "../../../features/settings/components/HealthSettingsForm"
import {
    getHealthSettings,
    HealthSettingsData,
} from "../../../features/settings/api/get-health-settings"
import {
    AccountSettingsData,
    getAccountSettings,
} from "../../../features/settings/api/get-account-settings"
import { putHealthSettings } from "../../../features/settings/api/put-health-settings"
import { useUser } from "@clerk/clerk-expo"
import { scheduleHealthReminders } from "../../../shared/utils/reminders"
import {
    calculateAgeFromDateOfBirth,
    computeBmr,
    Sex,
} from "../../../features/settings/settings.utils"

const EMPTY_SETTINGS: HealthSettingsData = {
    daily_calorie_goal_kcal: null,
    daily_carbohydrate_goal_g: null,
    reminder_frequency: null,
    reminder_time: null,
    diagnosed_with: null,
}

const EMPTY_ACCOUNT_SETTINGS: AccountSettingsData = {
    email: "",
    gender: null,
    date_of_birth: null,
    height_cm: null,
    weight_kg: null,
}

const getErrorMessage = (err: unknown) => {
    if (axios.isAxiosError(err)) {
        const apiMessage = err.response?.data?.message
        if (typeof apiMessage === "string" && apiMessage.trim()) return apiMessage
        return err.message
    }

    if (err instanceof Error) return err.message
    return "Failed to update health settings."
}

export default function HealthSettingsScreen() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [initialValues, setInitialValues] = useState<HealthSettingsData>(EMPTY_SETTINGS)
    const [accountSettings, setAccountSettings] =
        useState<AccountSettingsData>(EMPTY_ACCOUNT_SETTINGS)
    const { user, isLoaded } = useUser()

    const recommendedDailyCalories = useMemo(() => {
        const sex =
            accountSettings.gender === "MALE" || accountSettings.gender === "FEMALE"
                ? (accountSettings.gender as Sex)
                : null

        if (!sex) return null
        if (!accountSettings.date_of_birth) return null
        if (accountSettings.height_cm == null || accountSettings.weight_kg == null) return null

        const dateOfBirth = new Date(accountSettings.date_of_birth)
        if (Number.isNaN(dateOfBirth.getTime())) return null

        const ageYears = calculateAgeFromDateOfBirth(dateOfBirth)
        if (!Number.isFinite(ageYears) || ageYears <= 0) return null

        return Math.round(
            computeBmr({
                sex,
                weight_kg: accountSettings.weight_kg,
                height_cm: accountSettings.height_cm,
                age_years: ageYears,
            })
        )
    }, [accountSettings])

    const handleSave = async (values: SaveHealthSettingsInput) => {
        try {
            setSaving(true)

            const accountIdFromClerk = user?.id
            if (!accountIdFromClerk) {
                throw new Error("User ID from Clerk Auth API not found")
            }

            const result = await putHealthSettings({
                account_id: accountIdFromClerk,
                daily_calorie_goal_kcal: values.daily_calorie_goal_kcal,
                daily_carbohydrate_goal_g: values.daily_carbohydrate_goal_g,
                reminder_frequency: values.reminder_frequency,
                reminder_time: values.reminder_time,
                diagnosed_with: values.diagnosed_with,
            })

            if (result?.status && result.status !== "success") {
                throw new Error(result.message ?? "Failed to update health settings")
            }

            setInitialValues((prev) => ({
                ...prev,
                ...values,
                reminder_time:
                    typeof result?.data?.reminder_time === "string"
                        ? result.data.reminder_time
                        : prev.reminder_time,
            }))

            let reminderMessage = ""
            try {
                const reminderResult = await scheduleHealthReminders({
                    frequency: values.reminder_frequency,
                    timeOfDay: values.reminder_time,
                })

                if (reminderResult.permission === "denied") {
                    reminderMessage =
                        "Notifications are disabled. Enable them in system settings to receive reminders."
                }
            } catch (reminderError) {
                console.log("Reminder scheduling error:", reminderError)
                reminderMessage = "Unable to schedule reminders on this device."
            }

            const baseMessage =
                result?.message ?? "Health settings updated successfully."
            const message = reminderMessage
                ? `${baseMessage}\n\n${reminderMessage}`
                : baseMessage

            Alert.alert("Success", message)
        } catch (err) {
            console.log("Health settings save error:", err)
            Alert.alert("Error", getErrorMessage(err))
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        let mounted = true

        async function run() {
            try {
                if (!isLoaded) return

                const accountIdFromClerk = user?.id
                if (!accountIdFromClerk) {
                    setLoading(false)
                    return
                }

                setLoading(true)

                const [{ data: healthData }, { data: accountData }] = await Promise.all([
                    getHealthSettings(accountIdFromClerk),
                    getAccountSettings(accountIdFromClerk),
                ])

                if (!mounted) return
                setInitialValues(healthData)
                setAccountSettings(accountData)
            } catch (err) {
                console.log("Health settings fetch error:", err)
            } finally {
                if (!mounted) return
                setLoading(false)
            }
        }

        run()

        return () => {
            mounted = false
        }
    }, [user?.id, isLoaded])

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator />
                <StatusBar style="auto" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <HealthSettingsForm
                initialValues={initialValues}
                onSave={handleSave}
                saving={saving}
                recommendedDailyCalories={recommendedDailyCalories}
            />
            <StatusBar style="auto" />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 12,
    },
    loaderContainer: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
})
