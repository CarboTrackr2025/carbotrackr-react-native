import React, { useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useSignIn, useAuth } from "@clerk/clerk-expo"
import LoginForm from "../../features/auth/components/LoginForm"
import { loginWithClerk, loginWithOAuth } from "../../features/auth/api/auth.api"
import { color } from "../../shared/constants/colors"

export default function LoginScreen() {
    const router = useRouter()
    const { signIn, setActive } = useSignIn()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (email: string, password: string) => {
        console.log("📱 [Login Screen] Login button pressed")
        console.log("   Email:", email)

        if (!signIn || !setActive) {
            console.error("❌ [Login Screen] Clerk signIn or setActive not available")
            setError("Clerk is not initialized.")
            return
        }

        setSubmitting(true)
        setError(null)

        const result = await loginWithClerk(signIn, setActive, { email, password })
        setSubmitting(false)

        if (result.success) {
            console.log("✅ [Login Screen] Login successful, navigating to home")
            router.replace("/(tabs)")
        } else {
            console.error("❌ [Login Screen] Login failed:", result.message)
            setError(result.message)
        }
    }

    const handleOAuth = async (provider: "oauth_google" | "oauth_facebook") => {
        console.log("📱 [Login Screen] OAuth button pressed:", provider)

        if (!signIn) {
            console.error("❌ [Login Screen] Clerk signIn not available for OAuth")
            setError("Clerk is not initialized.")
            return
        }

        setSubmitting(true)
        setError(null)

        const result = await loginWithOAuth(signIn, provider)
        setSubmitting(false)

        if (!result.success) {
            console.error("❌ [Login Screen] OAuth failed:", result.message)
            setError(result.message)
        } else {
            console.log("✅ [Login Screen] OAuth flow initiated")
        }
        // Note: OAuth success redirects automatically via Clerk
    }

    return (
        <SafeAreaView style={styles.safe}>
            <LoginForm
                submitting={submitting}
                error={error}
                onLogin={handleLogin}
                onForgotPassword={() => router.push("/auth/forgot-password")}
                onSignUp={() => router.push("/auth/signup")}
                onFacebook={() => handleOAuth("oauth_facebook")}
                onGoogle={() => handleOAuth("oauth_google")}
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