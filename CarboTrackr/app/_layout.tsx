import React from "react";
import {StyleSheet, View} from "react-native";
import {Tabs} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {LinearGradient} from "expo-linear-gradient";
import {color, gradient} from "../shared/constants/colors";

export default function Layout() {
    type IconName = React.ComponentProps<typeof Ionicons>["name"];

    const TabIcon: React.FC<{
        focused: boolean;
        name: IconName;
        iconColor: string;
        size: number;
    }> = ({focused, name, iconColor, size}) =>
    {
        const TAB_ICON_SIZE = 32;
        const icon =
            (
                <Ionicons
                    name={name}
                    size={TAB_ICON_SIZE}
                    color={focused ? color.white : iconColor}
                />
            );

        if (!focused)
        {
            return <View style={styles.iconWrap}>{icon}</View>;
        }

        return (
            <LinearGradient
                colors={gradient.green as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconWrap}
            >
                {icon}
            </LinearGradient>
        );
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarInactiveTintColor: color.black,
                tabBarStyle: styles.tabBar,
                tabBarItemStyle: styles.tabBarItem,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({focused, color: iconColor, size}) => (
                        <TabIcon
                            focused={focused}
                            name="grid"
                            iconColor={iconColor}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="report"
                options={{
                    tabBarIcon: ({focused, color: iconColor, size}) => (
                        <TabIcon
                            focused={focused}
                            name="bar-chart"
                            iconColor={iconColor}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="health"
                options={{
                    tabBarIcon: ({focused, color: iconColor, size}) => (
                        <TabIcon
                            focused={focused}
                            name="fitness"
                            iconColor={iconColor}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="foodLogs"
                options={{
                    tabBarIcon: ({focused, color: iconColor, size}) => (
                        <TabIcon
                            focused={focused}
                            name="nutrition"
                            iconColor={iconColor}
                            size={size}
                        />
                    ),
                }}
            />


            <Tabs.Screen
                name="scanner"
                options={{
                    tabBarIcon: ({focused, color: iconColor, size}) => (
                        <TabIcon
                            focused={focused}
                            name="camera"
                            iconColor={iconColor}
                            size={size}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="auth/login"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}


const styles = StyleSheet.create({
    tabBar: {
        height: 100,
        paddingTop: 8,
        paddingBottom: 8,
        borderTopWidth: 0,
        elevation: 0,
        backgroundColor: color.white,
    },
    tabBarItem: {
        justifyContent: "center",
        alignItems: "center",
    },
    iconWrap: {
        width: 54,
        height: 54,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
});