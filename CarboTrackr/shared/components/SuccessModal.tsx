import React from "react"
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { color, gradient } from "../constants/colors"
import { LinearGradient } from "expo-linear-gradient"

type Props = {
    visible: boolean
    message?: string
    onClose: () => void
}

export function SuccessModal({
    visible,
    message = "Success!",
    onClose,
}: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* ── ICON ── */}
                    <LinearGradient
                        colors={gradient.green as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconCircle}
                    >
                        <Ionicons
                            name="checkmark-outline"
                            size={36}
                            color={color.white}
                        />
                    </LinearGradient>

                    {/* ── MESSAGE ── */}
                    <Text style={styles.title}>Success!</Text>
                    <Text style={styles.message}>{message}</Text>

                    {/* ── BUTTON ── */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={gradient.green as [string, string]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>OK</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    card: {
        backgroundColor: color.white,
        borderRadius: 20,
        padding: 32,
        alignItems: "center",
        width: "100%",
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: color.black,
    },
    message: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
    },
    button: {
        width: "100%",
        marginTop: 8,
        borderRadius: 12,
        overflow: "hidden",
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: "center",
        borderRadius: 12,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: "700",
        color: color.white,
    },
})