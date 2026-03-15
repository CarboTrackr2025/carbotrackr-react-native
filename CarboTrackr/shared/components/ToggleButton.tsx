import React from "react";
import {Pressable, Text, View, StyleSheet} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {color} from "../constants/colors";
import {gradient} from "../constants/colors";

type Props = {
    option1: string;
    option2: string;
    selectedOption: "option1" | "option2";
    onToggle: (option: "option1" | "option2") => void;
};

const filled = [color.white, color.white] as [string, string];
//clearfill is transparent
const clearfill = ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0)"] as [string, string];

export function ToggleButton({
    option1,
    option2,
    selectedOption,
    onToggle,
}: Props) {
    const isOption1Selected = selectedOption === "option1";

    return (
        <LinearGradient
                    colors={gradient.green as [string, string]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.border}
                    >
            <View style={styles.inner}>
                <Pressable
                    onPress={() => onToggle("option1")}
                    style={{flex: 1}}
                >
                    <LinearGradient
                        colors={isOption1Selected ? filled : clearfill}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.optionFill}
                    >
                        <Text style={[styles.text, {color: isOption1Selected ? color.green : color.white}]}>
                            {option1}
                        </Text>
                    </LinearGradient>
                </Pressable>

                <Pressable
                    onPress={() => onToggle("option2")}
                    style={{flex: 1}}
                >
                    <LinearGradient
                        colors={!isOption1Selected ? filled : clearfill}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.optionFill}
                    >
                        <Text style={[styles.text, {color: !isOption1Selected ? color.green : color.white}]}>
                            {option2}
                        </Text>
                    </LinearGradient>
                </Pressable>
            </View>
        </LinearGradient>
    );
}

const BORDER_W = 2.5;
const RADIUS = 12;

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        alignSelf: "stretch",
        marginTop: 80,
    },
    container: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    pressable: {
        flex: 1,
        alignSelf: "stretch",
        paddingHorizontal: 0,
    },
    border: {
        width: "100%",
        height: 54,
        borderRadius: RADIUS,
        padding: 10,
        justifyContent: "center",
        overflow: "hidden",
    },
    inner: {
        flex: 1,
        borderRadius: RADIUS - BORDER_W,
        justifyContent: "center",
        paddingHorizontal: 12,
        overflow: "hidden",
        flexDirection: "row",
    },
    optionFill: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: RADIUS - BORDER_W - 4,
        paddingHorizontal: 12,
    },
    fill: {
        ...StyleSheet.absoluteFillObject,
    },
    defaultFill: {
        backgroundColor: color.white,
    },
    text: {
        textAlign: "center",
        fontSize: 20,
        fontWeight: "900",
    },
});
