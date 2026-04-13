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
    onSignUp: (email: string, password: string) => void | Promise<void>
    onLogin: () => void
    onFacebook: () => void
    onGoogle: () => void
    onFAQ: () => void
}

export default function SignupForm({
    submitting = false,
    error,
    onSignUp,
    onLogin,
    onFacebook,
    onGoogle,
    onFAQ,
}: Props) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)

    const isValidEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    const canSubmit =
        email.trim().length > 0 &&
        password.length > 0 &&
        confirmPassword.length > 0 &&
        !submitting

    const handleSignUp = () => {
        if (!isValidEmail(email)) {
        setValidationError("Please enter a valid email address.")
        return
        }
        if (password.length < 8) {
            setValidationError("Password must be at least 8 characters.")
            return
        }
        if (password !== confirmPassword) {
            setValidationError("Passwords do not match.")
            return
        }
        setValidationError(null)
        onSignUp(email, password)
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

            {/* ── HEADING ── */}
            <Text style={styles.heading}>Start Tracking Now!</Text>

            {/* ── EMAIL ── */}
            <Text style={styles.label}>Email</Text>
            <GradientTextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                iconName="mail-outline"
                iconSize={20}
            />

            {/* ── PASSWORD ── */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputWrapper}>
                <GradientTextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    iconName="lock-closed-outline"
                    iconSize={1}
                    iconColor="transparent"
                />
                <TouchableOpacity
                    style={styles.eyeOverlay}
                    onPress={() => setShowPassword((prev) => !prev)}
                >
                    <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
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

            {/* ── VALIDATION / API ERROR ── */}
            {validationError ? (
                <Text style={styles.errorText}>{validationError}</Text>
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* ── SIGN UP BUTTON ── */}
            <View style={{ marginTop: 20 }}>
                <Button
                    title={submitting ? "Signing up..." : "Sign Up"}
                    onPress={handleSignUp}
                    gradient={gradient.green as [string, string]}
                    disabled={!canSubmit}
                />
            </View>

            {/* ── DIVIDER ── */}
            <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or sign up using</Text>
                <View style={styles.dividerLine} />
            </View>

            {/* ── SOCIAL BUTTONS ── */}
            <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialButton} onPress={onFacebook}>
                    <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                    <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton} onPress={onGoogle}>
                    <Ionicons name="logo-google" size={20} color="#EA4335" />
                    <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>
            </View>

            {/* ── LOGIN REDIRECT ── */}
            <TouchableOpacity style={styles.loginRow} onPress={onLogin}>
                <Text style={styles.loginText}>
                    Already have an account?{" "}
                    <Text style={styles.loginLink}>Log in here</Text>
                </Text>
                <Ionicons name="arrow-forward-outline" size={16} color={color.green} />
            </TouchableOpacity>

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
        textAlign: "center",
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
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 24,
        marginBottom: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E5E7EB",
    },
    dividerText: {
        marginHorizontal: 10,
        fontSize: 12,
        color: "#6B7280",
    },
    socialRow: {
        flexDirection: "row",
        gap: 12,
        justifyContent: "center",
    },
    socialButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingVertical: 12,
        backgroundColor: color.white,
    },
    socialText: {
        fontSize: 13,
        fontWeight: "600",
        color: color.black,
    },
    errorText: {
        color: color["red"],
        fontSize: 12,
        marginTop: 8,
        textAlign: "center",
    },
    loginRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 24,
        gap: 4,
    },
    loginText: {
        fontSize: 13,
        color: "#6B7280",
    },
    loginLink: {
        color: color.green,
        fontWeight: "600",
    },
})