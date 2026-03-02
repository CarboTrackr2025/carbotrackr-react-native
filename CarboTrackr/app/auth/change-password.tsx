import React, { useState } from "react"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useUser } from "@clerk/clerk-expo"
import ChangePasswordForm from "../../features/auth/components/ChangePasswordForm"
import { Toast } from "../../shared/components/Toast"
import { color } from "../../shared/constants/colors"
import { changePasswordWithClerk } from "../../features/auth/api/auth.api"

export default function ChangePasswordScreen() {
    const router = useRouter()
    const { user } = useUser()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showToast, setShowToast] = useState(false)

    const handleChangePassword = async (currentPassword: string, newPassword: string) => {
        if (!user) {
            setError("No authenticated user found. Please log in again.")
            return
        }

        setSubmitting(true)
        setError(null)

        const result = await changePasswordWithClerk(user, newPassword, currentPassword)

        setSubmitting(false)

        if (result.success) {
            setShowToast(true)
        } else {
            setError(result.message)
        }
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