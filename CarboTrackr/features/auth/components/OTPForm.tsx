import React, { useState, useRef, useEffect } from "react"
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { color, gradient } from "../../../shared/constants/colors"
import { Button } from "../../../shared/components/Button"

type Props = {
    submitting?: boolean
    error?: string | null
    onVerify: (otp: string) => void | Promise<void>
    onResend: () => void | Promise<void>
    onFAQ: () => void
}

// ── TOGGLE THIS to switch between the two resend behaviors ──────────
// "timer"  → resend appears after countdown reaches 0
// "failed" → resend appears after a failed verify attempt
const RESEND_MODE: "timer" | "failed" = "timer"
const TIMER_SECONDS = 60
// ────────────────────────────────────────────────────────────────────

export default function OTPForm({
    submitting = false,
    error,
    onVerify,
    onResend,
    onFAQ,
}: Props) {
    const [otp, setOtp] = useState<string[]>(["", "", "", "", ""])
    const [validationError, setValidationError] = useState<string | null>(null)
    const [showResend, setShowResend] = useState(false)
    const [timer, setTimer] = useState(TIMER_SECONDS)
    const inputRefs = useRef<(TextInput | null)[]>([])

    // Timer countdown for "timer" mode
    useEffect(() => {
        if (RESEND_MODE !== "timer") return

        if (timer <= 0) {
            setShowResend(true)
            return
        }

        const interval = setInterval(() => {
            setTimer((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [timer])

    // Show resend after failed attempt in "failed" mode
    useEffect(() => {
        if (RESEND_MODE === "failed" && error) {
            setShowResend(true)
        }
    }, [error])

    const handleChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Auto advance to next input
        if (value && index < 4) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyPress = (key: string, index: number) => {
        // Auto go back to previous input on backspace
        if (key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleVerify = () => {
        const otpValue = otp.join("")
        if (otpValue.length < 5) {
            setValidationError("Please enter all 5 digits.")
            return
        }
        setValidationError(null)
        onVerify(otpValue)
    }

    const handleResend = () => {
        setOtp(["", "", "", "", ""])
        setValidationError(null)
        setShowResend(false)
        setTimer(TIMER_SECONDS)
        inputRefs.current[0]?.focus()
        onResend()
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
            <Text style={styles.heading}>OTP</Text>

            {/* ── SUBHEADLINE ── */}
            <Text style={styles.subheading}>
                We've sent an OTP to your email. Check your Inbox, Spam, or Junk folders.
            </Text>

            {/* ── OTP SLOTS ── */}
            <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => {inputRefs.current[index] = ref}}
                        style={[
                            styles.otpSlot,
                            digit ? styles.otpSlotFilled : null,
                        ]}
                        value={digit}
                        onChangeText={(value) => handleChange(value, index)}
                        onKeyPress={({ nativeEvent }) =>
                            handleKeyPress(nativeEvent.key, index)
                        }
                        keyboardType="numeric"
                        maxLength={1}
                        textAlign="center"
                        selectTextOnFocus
                    />
                ))}
            </View>

            {/* ── ERRORS ── */}
            {validationError ? (
                <Text style={styles.errorText}>{validationError}</Text>
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* ── TIMER (only in timer mode) ── */}
            {RESEND_MODE === "timer" && !showResend && (
                <Text style={styles.timerText}>
                    Resend OTP in{" "}
                    <Text style={styles.timerCount}>{timer}s</Text>
                </Text>
            )}

            {/* ── RESEND ── */}
            {showResend && (
                <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
                    <Text style={styles.resendText}>Send Another OTP</Text>
                    <Ionicons name="refresh-outline" size={16} color={color.green} />
                </TouchableOpacity>
            )}

            {/* ── VERIFY BUTTON ── */}
            <View style={styles.buttonWrapper}>
                <Button
                    title={submitting ? "Verifying..." : "Verify"}
                    onPress={handleVerify}
                    gradient={gradient.green as [string, string]}
                    disabled={otp.join("").length < 5 || submitting}
                />
            </View>

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
        marginBottom: 12,
    },
    subheading: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 32,
        lineHeight: 22,
    },
    otpRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 16,
    },
    otpSlot: {
        flex: 1,
        height: 54,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        fontSize: 20,
        fontWeight: "700",
        color: color.black,
        backgroundColor: color.white,
    },
    otpSlotFilled: {
        borderColor: color.green,
    },
    errorText: {
        color: color["red"],
        fontSize: 12,
        marginTop: 4,
        marginBottom: 8,
        textAlign: "center",
    },
    timerText: {
        fontSize: 13,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 12,
    },
    timerCount: {
        color: color.green,
        fontWeight: "700",
    },
    resendButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 12,
    },
    resendText: {
        fontSize: 13,
        color: color.green,
        fontWeight: "600",
    },
    buttonWrapper: {
        position: "absolute",
        bottom: 32,
        left: 24,
        right: 24,
    },
})