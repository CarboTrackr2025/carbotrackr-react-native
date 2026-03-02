import React, { useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useSignUp } from "@clerk/clerk-expo"
import SignupForm from "../../features/auth/components/SignupForm"
import { signUpWithClerk } from "../../features/auth/api/auth.api"
import { color } from "../../shared/constants/colors"

export default function SignupScreen() {
    const router = useRouter()
    const { signUp, setActive, isLoaded } = useSignUp()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSignUp = async (email: string, password: string) => {
        console.log("📱 [Signup Screen] Sign-up button pressed for:", email)

        if (!isLoaded || !signUp || !setActive) {
            console.error("❌ [Signup Screen] Clerk useSignUp not ready")
            setError("Authentication service is not ready. Please try again.")
            return
        }

        setSubmitting(true)
        setError(null)

        const result = await signUpWithClerk(signUp, setActive, { email, password })
        setSubmitting(false)

        if (result.success) {
            console.log("✅ [Signup Screen] Sign-up successful! Navigating to home.")
            router.replace("/(tabs)")
        } else {
            console.error("❌ [Signup Screen] Sign-up failed:", result.message)
            setError(result.message)
        }
    }

    return (
        <SafeAreaView style={styles.safe}>
            <SignupForm
                submitting={submitting}
                error={error}
                onSignUp={handleSignUp}
                onLogin={() => router.replace("/auth/login")}
                onFacebook={() => {}}
                onGoogle={() => {}}
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