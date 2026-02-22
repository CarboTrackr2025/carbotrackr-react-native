import { useEffect, useState } from "react"
import { View, ActivityIndicator, StyleSheet } from "react-native"
import { Redirect } from "expo-router"
import { isLoggedIn } from "../features/auth/auth.utils"
import { color } from "../shared/constants/colors"

export default function Index() {
    const [checking, setChecking] = useState(true)
    const [loggedIn, setLoggedIn] = useState(false)

    useEffect(() => {
        isLoggedIn().then((result) => {
            setLoggedIn(result)
            setChecking(false)
        })
    }, [])

    // Show a spinner while we check storage
    if (checking) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={color.green} />
            </View>
        )
    }

    // Route based on auth state
    if (loggedIn) {
        return <Redirect href="/dashboard" />
    }

    return <Redirect href="/auth/login" />
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: color.white,
    },
})