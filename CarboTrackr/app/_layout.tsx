import { Stack } from "expo-router"
import { ClerkProvider } from "@clerk/clerk-expo"
import { tokenCache } from "../features/auth/auth.utils"

// Replace with your Clerk Publishable Key from Clerk Dashboard
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || ""

if (!CLERK_PUBLISHABLE_KEY) {
    console.error("❌ [Clerk Setup] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing!")
} else {
    console.log("✅ [Clerk Setup] Publishable key loaded:", CLERK_PUBLISHABLE_KEY.substring(0, 20) + "...")
}

export default function RootLayout() {
    return (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth/login" />
            </Stack>
        </ClerkProvider>
    )
}