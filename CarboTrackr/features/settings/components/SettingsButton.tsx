import React from "react";
import {Pressable, Text, View, StyleSheet} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {color, gradient} from "../../../shared/constants/colors";
import {Ionicons} from "@expo/vector-icons";


type Props = {
    label: string;
    onPress: () => void;
    iconName?: keyof typeof Ionicons.glyphMap;
    disabled?: boolean;
    size?: number;
};

const BORDER_W = 2.5;
const BUTTON_SIZE = 172;
const RADIUS = 22;

export function SettingsButton({
                                   label,
                                   onPress,
                                   iconName = "settings-outline",
                                   disabled = false,
                                   size = BUTTON_SIZE,
                               }: Props) {
    return (
        <View style={styles.wrapper}>
            <Pressable
                onPress={onPress}
                disabled={disabled}
                style={{width: size, height: size}}
            >
                {({pressed}) => (
                    <LinearGradient
                        colors={gradient.green as [string, string]}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={[
                            styles.border,
                            {
                                width: size,
                                height: size,
                                borderRadius: RADIUS,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.inner,
                                {borderRadius: RADIUS - BORDER_W},
                            ]}
                        >
                            {pressed ? (
                                <LinearGradient
                                    colors={gradient.green as [string, string]}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 1}}
                                    style={styles.fill}
                                />
                            ) : (
                                <View style={[styles.fill, styles.defaultFill]} />
                            )}

                            <Ionicons
                                name={iconName}
                                size={32}
                                color={pressed ? color.white : color.black}
                            />

                            <Text
                                style={[
                                    styles.label,
                                    {color: pressed ? color.white : color.black},
                                ]}
                                numberOfLines={1}
                            >
                                {label}
                            </Text>

                        </View>
                    </LinearGradient>
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignSelf: "flex-start",
    },
    border: {
        padding: BORDER_W,
        justifyContent: "center",
        overflow: "hidden",
    },
    inner: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        paddingHorizontal: 6,
        gap: 20
    },
    fill: {
        ...StyleSheet.absoluteFillObject,
    },
    defaultFill: {
        backgroundColor: color.white,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
});