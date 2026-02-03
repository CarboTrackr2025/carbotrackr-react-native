import {Tabs} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {color} from "../shared/constants/colors"

export default function Layout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false, // hides the top header title
                tabBarActiveTintColor: color.green,
                tabBarInactiveTintColor: color.black,

            }}
        >

            <Tabs.Screen
                name="index"
                options={{
                    tabBarLabel: () => null,
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="home" size={size + 6} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="(main)/scanner/index"
                options={{
                    tabBarLabel: () => null,
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="camera" size={size + 6} color={color}/>
                    ),
                }}
            />

        </Tabs>
    );
}