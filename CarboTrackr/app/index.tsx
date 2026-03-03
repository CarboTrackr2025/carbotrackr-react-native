import { View, ActivityIndicator, StyleSheet } from "react-native"
import { Redirect } from "expo-router"
import { useAuth } from "@clerk/clerk-expo"
import { color } from "../shared/constants/colors"

export default function Index() {
    const { isSignedIn, isLoaded } = useAuth()

    console.log("🚀 [App Start] Auth state:", { isLoaded, isSignedIn })

    if (!isLoaded) {
        console.log("⏳ [App Start] Waiting for Clerk to load...")
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={color.green} />
            </View>
        )
    }

    if (isSignedIn) {
        console.log("✅ [App Start] User is signed in, redirecting to home")
        return <Redirect href="/(tabs)" />
    }

    console.log("❌ [App Start] User not signed in, redirecting to login")
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