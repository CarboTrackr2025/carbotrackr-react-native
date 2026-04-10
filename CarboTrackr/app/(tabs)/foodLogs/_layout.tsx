import { Stack } from "expo-router";
import {StatusBar} from "expo-status-bar";

export default function Layout() {
    return (

        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: true,
                    title: "Food Logs"}}
            />

            <Stack.Screen
                name="[food_id]"
                options={{
                    headerShown: true,
                    title: "Food Details",
                }}
            />

            <Stack.Screen
                name="search-food"
                options={{
                    headerShown: true,
                    title: "Search Food",
                }}
            />
            <StatusBar style="auto"/>
        </Stack>
    );
}
