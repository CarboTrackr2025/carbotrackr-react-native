import React from "react"
import {StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle} from "react-native"
import {LinearGradient} from "expo-linear-gradient"
import {gradient as appGradient} from "../constants/colors"

type Props = {
  text: string
  colors?: [string, string]
  containerStyle?: StyleProp<ViewStyle>
  innerStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  numberOfLines?: number
}

export function GradientTextDisplay({
  text,
  colors = appGradient.green as [string, string],
  containerStyle,
  innerStyle,
  textStyle,
  numberOfLines,
}: Props) {
  return (
    <LinearGradient
      colors={colors}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[styles.container, containerStyle]}
    >
      <View style={[styles.inner, innerStyle]}>
        <Text
          style={[styles.text, textStyle]}
          numberOfLines={numberOfLines}
          ellipsizeMode="tail"
        >
          {text}
        </Text>
      </View>
    </LinearGradient>
  )
}

const BORDER_W = 2.5
const RADIUS = 12

const styles = StyleSheet.create({
  container: {
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
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  text: {
    color: "#111827",
    fontSize: 14,
    opacity: 0.8,
  },
})