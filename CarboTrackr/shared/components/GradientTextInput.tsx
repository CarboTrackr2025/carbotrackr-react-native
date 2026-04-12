import React from "react"
import {
    StyleProp,
    StyleSheet,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from "react-native"
import {LinearGradient} from "expo-linear-gradient"
import {Ionicons} from "@expo/vector-icons"
import {gradient, color} from "../constants/colors"

type IoniconName = React.ComponentProps<typeof Ionicons>["name"]

type Props = Omit<TextInputProps, "style"> & {
    colors?: [string, string]
    containerStyle?: StyleProp<ViewStyle>
    inputInnerStyle?: StyleProp<ViewStyle>
    textInputStyle?: StyleProp<TextStyle>
    iconStyle?: StyleProp<TextStyle>
    iconName?: IoniconName | null
    iconSize?: number
    iconColor?: string
}

export function GradientTextInput({
                                  colors = gradient.green as [string, string],
                                  containerStyle,
                                  inputInnerStyle,
                                  textInputStyle,
                                  iconStyle,
                                  iconName = "pencil",
                                  iconSize = 32,
                                  iconColor = color.black,
                                  onFocus,
                                  onBlur,
                                  ...textInputProps
                              }: Props) {
    const [isFocused, setIsFocused] = React.useState(false)
    const isMultiline = Boolean(textInputProps.multiline)

    const focusedBg = color["light-green-2"]

    return (
        <LinearGradient
            colors={colors}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.inputBorder, containerStyle]}
        >
            <View
                style={[
                    styles.inputInner,
                    isMultiline && styles.inputInnerMultiline,
                    inputInnerStyle,
                    isFocused && {backgroundColor: focusedBg},
                ]}
            >
                <TextInput
                    {...textInputProps}
                    style={[
                        styles.textInput,
                        isMultiline && styles.textInputMultiline,
                        textInputStyle,
                    ]}
                    placeholderTextColor={textInputProps.placeholderTextColor ?? "#9CA3AF"}
                    onFocus={(e) => {
                        setIsFocused(true)
                        onFocus?.(e)
                    }}
                    onBlur={(e) => {
                        setIsFocused(false)
                        onBlur?.(e)
                    }}
                />
                {iconName ? (
                    <Ionicons
                        name={iconName}
                        size={iconSize}
                        color={iconColor}
                        style={iconStyle}
                    />
                ) : null}
            </View>
        </LinearGradient>
    )
}

const BORDER_W = 2.5
const RADIUS = 12

const styles = StyleSheet.create({
    inputBorder: {
        width: "100%",
        minHeight: 54,
        borderRadius: RADIUS,
        padding: BORDER_W,
        justifyContent: "center",
        overflow: "hidden",
    },
    inputInner: {
        flex: 1,
        borderRadius: RADIUS - BORDER_W,
        justifyContent: "center",
        paddingHorizontal: 10,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
        flexDirection: "row",
        alignItems: "center",
    },
    inputInnerMultiline: {
        alignItems: "flex-start",
    },
    textInput: {
        flex: 1,
        paddingVertical: 0,
        color: color.black,
        fontSize: 14,
    },
    textInputMultiline: {
        paddingTop: 8,
        textAlignVertical: "top",
    },
})