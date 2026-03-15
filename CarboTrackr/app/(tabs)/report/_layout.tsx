import { Stack } from "expo-router";

export default function Layout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{headerShown: false}} />
            <Stack.Screen name="calorie-report" options={{ headerShown: false }} />
            <Stack.Screen name="carbohydrate-report" options={{ headerShown: false }} />
        </Stack>
    )
}