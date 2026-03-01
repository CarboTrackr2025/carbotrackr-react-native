import React, { useState } from "react"
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity
} from "react-native"
import { color, gradient } from "../../../shared/constants/colors"
import { GradientTextInput } from "../../../shared/components/GradientTextInput"
import { Button } from "../../../shared/components/Button"
import { Ionicons } from "@expo/vector-icons"

type Props = {
    submitting?: boolean
    error?: string | null
    onSend: (email: string) => void | Promise<void>
    onFAQ: () => void
}

export default function ForgotPasswordForm({
    submitting = false,
    error,
    onSend,
    onFAQ
}: Props) {
    const [email, setEmail] = useState("")
    const [validationError, setValidationError] = useState<string | null>(null)

    const isValidEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    const canSubmit = email.trim().length > 0 && !submitting

    const handleSend = () => {
        if (!isValidEmail(email)) {
            setValidationError("Please enter a valid email address.")
            return
        }
        setValidationError(null)
        onSend(email)
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
            <Text style={styles.heading}>Reset Password</Text>

            {/* ── SUBHEADLINE ── */}
            <Text style={styles.subheading}>
                Please enter your email to send a request to change your password
            </Text>

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

            {/* ── ERRORS ── */}
            {validationError ? (
                <Text style={styles.errorText}>{validationError}</Text>
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* ── SEND BUTTON ── */}
            <Button
                title={submitting ? "Sending..." : "Send"}
                onPress={handleSend}
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
        marginTop: 16,
        marginBottom: 12,
    },
    subheading: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 28,
        lineHeight: 22,
    },
    label: {
        marginTop: 12,
        marginBottom: 4,
        fontSize: 14,
        fontWeight: "600",
        color: color.black,
    },
    errorText: {
        color: color["red"],
        fontSize: 12,
        marginTop: 8,
        textAlign: "center",
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
})