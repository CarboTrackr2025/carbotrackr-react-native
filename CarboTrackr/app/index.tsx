import { useEffect, useState } from "react"
import { View, ActivityIndicator, StyleSheet } from "react-native"
import { Redirect } from "expo-router"
import { isLoggedIn } from "../features/auth/auth.utils"
import { color } from "../shared/constants/colors"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function Index() {
    const [checking, setChecking] = useState(true)
    const [loggedIn, setLoggedIn] = useState(false)

    useEffect(() => {
        AsyncStorage.clear().then(() => {
            isLoggedIn().then((result) => {
                setLoggedIn(result)
                setChecking(false)
            })
        })
    }, [])

    if (checking) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={color.green} />
            </View>
        )
    }

    if (loggedIn) {
        return <Redirect href="/(tabs)" />
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