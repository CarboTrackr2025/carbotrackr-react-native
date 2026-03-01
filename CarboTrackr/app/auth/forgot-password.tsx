import React, { useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import ForgotPasswordForm from "../../features/auth/components/ForgotPasswordForm"
import { color } from "../../shared/constants/colors"

export default function ForgotPasswordScreen() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSend = async (email: string) => {
        setSubmitting(true)
        setError(null)

        // ── MOCK (remove when backend is ready) ──────────────────────────
            const MOCK_EMAIL = "test@carbotrackr.com"

            if (email !== MOCK_EMAIL) {
                setSubmitting(false)
                setError("No account found with that email address.")
                return
            }
        // ── END MOCK ─────────────────────────────────────────────────────

        setSubmitting(false)
        router.push("/auth/otp")
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ForgotPasswordForm
                submitting={submitting}
                error={error}
                onSend={handleSend}
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