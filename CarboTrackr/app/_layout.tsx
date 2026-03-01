import { Stack } from "expo-router"

export default function RootLayout() {
    return (
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
    )
}