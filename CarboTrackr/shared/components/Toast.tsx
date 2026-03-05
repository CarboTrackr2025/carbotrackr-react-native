import React, { useEffect, useRef } from "react"
import {
    Animated,
    StyleSheet,
    Text,
} from "react-native"
import { color } from "../constants/colors"

type Props = {
    message: string
    visible: boolean
    type?: "success" | "error"
    duration?: number
    onHide?: () => void
}

export function Toast({
    message,
    visible,
    type = "success",
    duration = 2500,
    onHide,
}: Props) {
    const opacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(duration),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onHide?.()
            })
        }
    }, [visible])

    if (!visible) return null

    return (
        <Animated.View
            style={[
                styles.container,
                type === "success" ? styles.success : styles.error,
                { opacity },
            ]}
        >
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 40,
        left: 24,
        right: 24,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        zIndex: 999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    success: {
        backgroundColor: color.green,
    },
    error: {
        backgroundColor: color.red,
    },
    message: {
        color: color.white,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
})