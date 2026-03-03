import { Stack } from "expo-router"
import { ClerkProvider } from "@clerk/clerk-expo"
import { tokenCache } from "../features/auth/auth.utils"

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

export default function RootLayout() {
    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen
                name="(tabs)"
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen
                name="auth/login"
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen
                name="auth/signup"
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen
                name="auth/forgot-password"
                options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="auth/otp" />
            <Stack.Screen name="auth/change-password" />
        </Stack>
        </ClerkProvider>
    )
}