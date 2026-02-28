import React, { useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import LoginForm from "../../features/auth/components/LoginForm"
import { login } from "../../features/auth/api/auth.api"
import { color } from "../../shared/constants/colors"

export default function LoginScreen() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (email: string, password: string) => {
        setSubmitting(true)
        setError(null)
        const result = await login({ email, password })
        setSubmitting(false)

        if (result.success) {
            router.replace("/(tabs)")
        } else {
            setError(result.message)
        }
    }

    return (
        <SafeAreaView style={styles.safe}>
            <LoginForm
                submitting={submitting}
                error={error}
                onLogin={handleLogin}
                onForgotPassword={() => router.push("/auth/forgot-password")}
                onSignUp={() => router.replace("/auth/signup")}
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