import React, { useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import ChangePasswordForm from "../../features/auth/components/ChangePasswordForm"
import { color } from "../../shared/constants/colors"

export default function ChangePasswordScreen() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChangePassword = async (newPassword: string) => {
        setSubmitting(true)
        setError(null)

        // TODO: replace with real API call when backend is ready
        // e.g. await api.post("/auth/change-password", { newPassword })

        setSubmitting(false)

        // After successful password change, send back to login
        router.replace("/auth/login")
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ChangePasswordForm
                submitting={submitting}
                error={error}
                onChangePassword={handleChangePassword}
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