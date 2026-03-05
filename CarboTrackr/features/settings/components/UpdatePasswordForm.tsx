import React, { useState } from "react"
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { color, gradient } from "../../../shared/constants/colors"
import { GradientTextInput } from "../../../shared/components/GradientTextInput"
import { Button } from "../../../shared/components/Button"
import { Header } from "../../../shared/components/Header"

type Props = {
    submitting?: boolean
    error?: string | null
    onChangePassword: (
        oldPassword: string,
        newPassword: string
    ) => void | Promise<void>
    onForgotPassword: () => void
    onFAQ: () => void
}

const isStrongPassword = (password: string): boolean => {
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSymbol = /[^A-Za-z0-9]/.test(password)
    return hasUppercase && hasLowercase && hasNumber && hasSymbol
}

export default function UpdatePasswordForm({
    submitting = false,
    error,
    onChangePassword,
    onForgotPassword,
    onFAQ,
}: Props) {
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)

    const canSubmit =
        oldPassword.length > 0 &&
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        !submitting

    const handleChangePassword = () => {
        if (newPassword.length < 8) {
            setValidationError("Password must be at least 8 characters.")
            return
        }
        if (!isStrongPassword(newPassword)) {
            setValidationError(
                "Password must include uppercase, lowercase, a number, and a symbol."
            )
            return
        }
        if (newPassword !== confirmPassword) {
            setValidationError("Passwords do not match.")
            return
        }
        if (oldPassword === newPassword) {
            setValidationError("New password must be different from old password.")
            return
        }
        setValidationError(null)
        onChangePassword(oldPassword, newPassword)
    }

    return (
        <View style={styles.container}>

            {/* ── HEADER ── */}
            <Header onFAQ={onFAQ} />

            {/* ── HEADLINE ── */}
            <Text style={styles.heading}>Change Password</Text>

            {/* ── OLD PASSWORD ── */}
            <Text style={styles.label}>Old Password</Text>
            <View style={styles.passwordInputWrapper}>
                <GradientTextInput
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showOldPassword}
                    iconName="lock-closed-outline"
                    iconSize={1}
                    iconColor="transparent"
                />
                <TouchableOpacity
                    style={styles.eyeOverlay}
                    onPress={() => setShowOldPassword((prev) => !prev)}
                >
                    <Ionicons
                        name={showOldPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={color.black}
                    />
                </TouchableOpacity>
            </View>

            {/* ── NEW PASSWORD ── */}
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordInputWrapper}>
                <GradientTextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showNewPassword}
                    iconName="lock-closed-outline"
                    iconSize={1}
                    iconColor="transparent"
                />
                <TouchableOpacity
                    style={styles.eyeOverlay}
                    onPress={() => setShowNewPassword((prev) => !prev)}
                >
                    <Ionicons
                        name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={color.black}
                    />
                </TouchableOpacity>
            </View>

            {/* ── CONFIRM PASSWORD ── */}
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordInputWrapper}>
                <GradientTextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showConfirmPassword}
                    iconName="lock-closed-outline"
                    iconSize={1}
                    iconColor="transparent"
                />
                <TouchableOpacity
                    style={styles.eyeOverlay}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                >
                    <Ionicons
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={color.black}
                    />
                </TouchableOpacity>
            </View>

            {/* ── FORGOT PASSWORD ── */}
            <TouchableOpacity
                onPress={onForgotPassword}
                style={styles.forgotRow}
            >
                <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>

            {/* ── ERRORS ── */}
            <View style={styles.errorContainer}>
                {validationError ? (
                    <Text style={styles.errorText}>{validationError}</Text>
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : null}
            </View>

            {/* ── BUTTON ── */}
            <Button
                title={submitting ? "Changing..." : "Change my Password"}
                onPress={handleChangePassword}
                gradient={gradient.green as [string, string]}
                disabled={!canSubmit}
            />

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: color.white,
    },
    heading: {
        fontSize: 26,
        fontWeight: "700",
        color: color.black,
        marginBottom: 8,
    },
    label: {
        marginTop: 12,
        marginBottom: 4,
        fontSize: 14,
        fontWeight: "600",
        color: color.black,
    },
    passwordInputWrapper: {
        position: "relative",
        justifyContent: "center",
    },
    eyeOverlay: {
        position: "absolute",
        right: 12,
        height: 54,
        justifyContent: "center",
        zIndex: 10,
    },
    forgotRow: {
        alignItems: "flex-end",
        marginTop: 8,
        marginBottom: 4,
    },
    forgotText: {
        fontSize: 12,
        color: color.green,
        fontWeight: "500",
    },
    errorContainer: {
        minHeight: 20,
        marginTop: 8,
        marginBottom: 4,
    },
    errorText: {
        color: color["red"],
        fontSize: 12,
        textAlign: "center",
    },
})