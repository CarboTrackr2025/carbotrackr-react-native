import React, { useEffect, useState } from "react"
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
import { putHealthSettings } from "../../../features/settings/api/put-health-settings"
import { getClerkUserId } from "../../../features/auth/auth.utils"

const EMPTY_SETTINGS: HealthSettingsData = {
    daily_calorie_goal_kcal: null,
    daily_carbohydrate_goal_g: null,
    reminder_frequency: null,
    diagnosed_with: null,
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

    const handleSave = async (values: SaveHealthSettingsInput) => {
        try {
            setSaving(true)

            const accountIdFromClerk = await getClerkUserId()
            if (!accountIdFromClerk) {
                throw new Error("User ID from Clerk Auth API not found")
            }

            const result = await putHealthSettings({
                account_id: accountIdFromClerk,
                daily_calorie_goal_kcal: values.daily_calorie_goal_kcal,
                daily_carbohydrate_goal_g: values.daily_carbohydrate_goal_g,
                reminder_frequency: values.reminder_frequency,
                diagnosed_with: values.diagnosed_with,
            })

            if (result?.status && result.status !== "success") {
                throw new Error(result.message ?? "Failed to update health settings")
            }

            setInitialValues((prev) => ({
                ...prev,
                ...values,
            }))

            Alert.alert("Success", result?.message ?? "Health settings updated successfully.")
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
                setLoading(true)

                const accountIdFromClerk = await getClerkUserId()
                if (!accountIdFromClerk) {
                    throw new Error("User ID from Clerk Auth API not found")
                }

                const { data } = await getHealthSettings(accountIdFromClerk)

                if (!mounted) return
                setInitialValues(data)
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
    }, [])

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