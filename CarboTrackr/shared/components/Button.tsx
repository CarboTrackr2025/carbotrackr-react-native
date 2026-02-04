import React from "react";
import {Pressable, Text, View, StyleSheet} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {color} from "../constants/colors";

type Props = {
    title: string;
    onPress: () => void;
    gradient: [string, string];
    disabled?: boolean;
};

export function Button({title, onPress, gradient}: Props) {
    return (
        <View style={styles.wrapper}>
            <Pressable onPress={onPress} style={styles.pressable}>
                {({pressed}) => (
                    <LinearGradient
                        colors={gradient}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.border}
                    >
                        <View style={styles.inner}>
                            {pressed ? (
                                <LinearGradient
                                    colors={gradient}
                                    start={{x: 0, y: 0}}
                                    end={{x: 1, y: 1}}
                                    style={styles.fill}
                                />
                            ) : (
                                <View style={[styles.fill, styles.defaultFill]}/>
                            )}

                            <Text
                                style={[
                                    styles.text,
                                    {color: pressed ? color.white : color.black},
                                ]}
                            >
                                {title}
                            </Text>
                        </View>
                    </LinearGradient>
                )}
            </Pressable>
        </View>
    );
}

const BORDER_W = 2.5
const RADIUS = 12

const styles = StyleSheet.create({
    wrapper:
    {
        width: "100%",
        alignSelf: "stretch",
        marginTop: 80,
    },
    pressable: {
        width: "100%",
        alignSelf: "stretch",
        paddingHorizontal: 0,
    },
    border: {
        width: "100%",
        height: 54,
        borderRadius: RADIUS,
        padding: BORDER_W,
        justifyContent: "center",
        overflow: "hidden",
    },
    inner: {
        flex: 1,
        borderRadius: RADIUS - BORDER_W,
        justifyContent: "center",
        paddingHorizontal: 12,
        overflow: "hidden",
    },
    fill: {
        ...StyleSheet.absoluteFillObject,
    },
    defaultFill: {
        backgroundColor: color.white,
    },
    text: {
        textAlign: "center",
        fontSize: 14,
        fontWeight: "600",
    },
});