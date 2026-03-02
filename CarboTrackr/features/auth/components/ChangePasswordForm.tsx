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

type Props = {
    submitting?: boolean
    error?: string | null
    onChangePassword: (currentPassword: string, newPassword: string) => void | Promise<void>
    onFAQ: () => void
}

const isStrongPassword = (password: string): boolean => {
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSymbol = /[^A-Za-z0-9]/.test(password)
    return hasUppercase && hasLowercase && hasNumber && hasSymbol
}

export default function ChangePasswordForm({
    submitting = false,
    error,
    onChangePassword,
    onFAQ,
}: Props) {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)

    const canSubmit =
        currentPassword.length > 0 &&
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        !submitting

    const handleChangePassword = () => {
        if (currentPassword.length < 1) {
            setValidationError("Please enter your current password.")
            return
        }
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
        setValidationError(null)
        onChangePassword(currentPassword, newPassword)
    }

    return (
        <View style={styles.container}>

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <Text style={styles.headerBrand}>CarboTrackr</Text>
                <TouchableOpacity onPress={onFAQ} style={styles.faqButton}>
                    <Ionicons name="help-circle-outline" size={28} color={color.black} />
                </TouchableOpacity>
            </View>

            {/* ── HEADLINE ── */}
            <Text style={styles.heading}>Change Password</Text>

            {/* ── CURRENT PASSWORD ── */}
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordInputWrapper}>
                <GradientTextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showCurrentPassword}
                    iconName="lock-closed-outline"
                    iconSize={1}
                    iconColor="transparent"
                />
                <TouchableOpacity
                    style={styles.eyeOverlay}
                    onPress={() => setShowCurrentPassword((prev) => !prev)}
                >
                    <Ionicons
                        name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 32,
        marginTop: 16,
    },
    headerBrand: {
        fontSize: 20,
        fontWeight: "700",
        color: color.green,
    },
    faqButton: {
        padding: 4,
    },
    heading: {
        fontSize: 26,
        fontWeight: "700",
        color: color.black,
        marginBottom: 28,
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
    errorText: {
        color: color["red"],
        fontSize: 12,
        marginTop: 8,
        textAlign: "center",
    },
    errorContainer: {
        minHeight: 20,
        marginTop: 8,
        marginBottom: 4,
    },
    // buttonWrapper: {
    //     position: "absolute",
    //     bottom: 32,
    //     left: 24,
    //     right: 24,
    // },
})