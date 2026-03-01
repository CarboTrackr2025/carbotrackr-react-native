import React, { useState } from "react"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import ChangePasswordForm from "../../features/auth/components/ChangePasswordForm"
import { Toast } from "../../shared/components/Toast"
import { color } from "../../shared/constants/colors"

export default function ChangePasswordScreen() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showToast, setShowToast] = useState(false)

    const handleChangePassword = async (newPassword: string) => {
        setSubmitting(true)
        setError(null)

        // TODO: replace with real API call when backend is ready
        // e.g. await api.post("/auth/change-password", { newPassword })

        setSubmitting(false)
        setShowToast(true)
    }

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.inner}>
                <ChangePasswordForm
                    submitting={submitting}
                    error={error}
                    onChangePassword={handleChangePassword}
                    onFAQ={() => router.push("/faqs")}
                />
                <Toast
                    message="Password changed successfully!"
                    visible={showToast}
                    type="success"
                    duration={600}
                    onHide={() => {
                        setShowToast(false)
                        router.replace("/auth/login")
                    }}
                />
            </View>
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
        position: "relative",
    },
})