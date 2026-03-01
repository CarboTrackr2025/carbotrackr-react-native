import React, { useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import OTPForm from "../../features/auth/components/OTPForm"
import { color } from "../../shared/constants/colors"

const MOCK_OTP = "12345"

export default function OTPScreen() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleVerify = async (otp: string) => {
        setSubmitting(true)
        setError(null)

        // ── MOCK (remove when backend is ready) ──────────────────────
        if (otp !== MOCK_OTP) {
            setSubmitting(false)
            setError("Incorrect OTP. Please try again.")
            return
        }
        // ── END MOCK ─────────────────────────────────────────────────

        // ── REAL (uncomment when backend is ready) ────────────────────
        // try {
        //     await api.post("/auth/verify-otp", { otp })
        // } catch (error: any) {
        //     setSubmitting(false)
        //     setError(error?.response?.data?.message ?? "Incorrect OTP.")
        //     return
        // }
        // ── END REAL ─────────────────────────────────────────────────

        setSubmitting(false)
        router.push("/auth/change-password")
    }

    const handleResend = async () => {
        // TODO: call resend OTP API when backend is ready
        // e.g. await api.post("/auth/resend-otp")
        console.log("Resend OTP requested")
    }

    return (
        <SafeAreaView style={styles.safe}>
            <OTPForm
                submitting={submitting}
                error={error}
                onVerify={handleVerify}
                onResend={handleResend}
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