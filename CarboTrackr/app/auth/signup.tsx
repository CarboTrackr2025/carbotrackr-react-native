import React, { useState } from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import SignupForm from "../../features/auth/components/SignupForm"
import { color } from "../../shared/constants/colors"

export default function SignupScreen() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSignUp = async (email: string, password: string) => {
        setSubmitting(true)
        setError(null)

        // TODO: replace with real signup API call when backend is ready
        setSubmitting(false)
        router.replace("/(tabs)")
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