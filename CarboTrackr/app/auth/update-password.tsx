import React, { useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import UpdatePasswordForm from "../../features/auth/UpdatePasswordForm"
import { color } from "../../shared/constants/colors"

export default function UpdatePasswordScreen() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChangePassword = async (
        oldPassword: string,
        newPassword: string
    ) => {
        setSubmitting(true)
        setError(null)

        // TODO: replace with real API call when backend is ready
        // e.g. await api.post("/settings/change-password", { oldPassword, newPassword })

        setSubmitting(false)
        router.back()
    }

    return (
        <SafeAreaView style={styles.safe}>
            <UpdatePasswordForm
                submitting={submitting}
                error={error}
                onChangePassword={handleChangePassword}
                onForgotPassword={() => router.push("/auth/forgot-password")}
                onFAQ={() => router.push("/faqs")}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: color.white,
    },
})