import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";

export default function Layout() {
    return (
        <Stack>
            <StatusBar style="auto"/>
            <Stack.Screen
                name="index" options={{headerShown: true, title: "Health"}}/>
            <Stack.Screen
                name="add-blood-pressure"
                options={{headerShown: true, title: "Measure Blood Pressure"}}
            />
            <Stack.Screen
                name="add-blood-glucose"
                options={{headerShown: true, title: "Measure Blood Glucose"}}
            />
        </Stack>
    );
}
