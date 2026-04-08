import React, { useState } from "react"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import SetupProfileForm, { SetupProfileInput } from "../../features/auth/components/SetupProfileForm"
import { postAccountAndHealthSettings } from "../../features/auth/api/postAccountAndHealthSettings"
import { getClerkUserId } from "../../features/auth/auth.utils"
import { color } from "../../shared/constants/colors"

export default function SetupProfileScreen() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSave = async (values: SetupProfileInput) => {
        try {
            setSaving(true)
            setError(null)

            const accountId = await getClerkUserId()
            if (!accountId) {
                setError("Could not find your account. Please log in again.")
                return
            }

            console.log("📝 [SetupProfile] Saving profile for:", accountId)

            const result = await postAccountAndHealthSettings({
                account_id: accountId,
                gender: values.gender,
                date_of_birth: values.date_of_birth,
                height_cm: values.height_cm,
                weight_kg: values.weight_kg,
                reminder_frequency: values.reminder_frequency,
                reminder_time: "08:00", // Hardcoded per backend schema requirement
                diagnosed_with: values.diagnosed_with,
            })

            if (result.status && result.status !== "success") {
                setError(result.message ?? "Failed to save profile. Please try again.")
                return
            }

            console.log("✅ [SetupProfile] Profile saved, navigating to home")
            router.replace("/(tabs)")
        } catch (err: any) {
            console.error("❌ [SetupProfile] Failed to save profile:", err)
            setError(
                err?.response?.data?.message ??
                err?.message ??
                "Failed to save profile. Please try again."
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.inner}>
                <SetupProfileForm onSave={handleSave} saving={saving} error={error} />
            </View>
            <StatusBar style="auto" />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: color.white,
    },
    inner: {
        flex: 1,
        padding: 20,
    },
})
