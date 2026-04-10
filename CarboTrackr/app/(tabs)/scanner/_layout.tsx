import { Stack } from "expo-router";

export default function Layout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{headerShown: true, headerTitle: "Scanners"}} />
            <Stack.Screen name="nutritional-info-scanner" options={{ headerTitle: "Nutritional Info Scanner" }} />
            <Stack.Screen name="solid-food-scanner" options={{ headerTitle: "Solid Food Scanner" }} />
        </Stack>
    )
}