import { Stack } from "expo-router";

export default function Layout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{headerShown: true, title: "Settings"}} />
            <Stack.Screen name="account-settings" options={{
                headerShown: true,
                title: "Account Settings"
            }} />
            <Stack.Screen name="health-settings" options={{
                headerShown: true,
                title: "Health Settings"
            }} />
        </Stack>
    )
}