import React from "react"
import {StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle} from "react-native"
import {LinearGradient} from "expo-linear-gradient"
import {gradient as appGradient} from "../constants/colors"
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"]

type Props = {
  text: string
  colors?: [string, string]
  containerStyle?: StyleProp<ViewStyle>
  innerStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  numberOfLines?: number
  unit: "g" | "kg" | "calories" | "minutes" | "mmHg" | "mgDl"
  iconName?: IoniconName
  size?: number
}

export function Reading({
  text,
  colors = appGradient.green as [string, string],
  containerStyle,
  innerStyle,
  textStyle,
  numberOfLines,
  unit,
  iconName,
  size,
}: Props) {
  const circleSize = size ?? Math.min(width * 0.72, 300)

  return (
      <LinearGradient
        colors={colors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[
          styles.container,
          { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
          containerStyle,
        ]}
      >
        <View style={[styles.inner, { borderRadius: (circleSize - BORDER_W * 2) / 2 }, innerStyle]}>
            <View style={[styles.defaultFill, styles.fill]}/>
            {iconName ? <Ionicons name={iconName} size={42} color="#111827" /> : null}
            <Text
                style={[styles.text, iconName ? styles.metricText : null, textStyle]}
                numberOfLines={numberOfLines}
                ellipsizeMode="tail"
            >
                {text}
            </Text>
            <Text style={[styles.unitText, iconName ? styles.metricUnitText : null]}>
                {` ${unit === "kg" ? "kg remaining" : unit === "g" ? "grams remaining" : unit === "calories" ? "calories remaining" : unit === "minutes" ? "active minutes" : unit === "mmHg" ? "mmHg" : unit === "mgDl" ? "mg/dL" : ""}`}
            </Text>
        </View>
      </LinearGradient>
    )
  }
  
  const BORDER_W = 2.5

  const { width } = Dimensions.get("window");
  
  const styles = StyleSheet.create({
    container: {
            padding: BORDER_W,
        justifyContent: "center",
        overflow: "hidden",
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
            elevation: 8,
    },
    inner: {
        flex: 1,
        justifyContent: "center",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 18,
        overflow: "hidden",
    },
    text: {
      color: "#111827",
      fontSize: 30,
      fontWeight: "600",
        textAlign: "center",
        },
        unitText: {
          color: "#111827",
      fontSize: 20,
      opacity: 0.6,
          textAlign: "center",
    },
    metricText: {
      fontSize: 58,
      fontWeight: "700",
      lineHeight: 64,
      opacity: 1,
    },
    metricUnitText: {
      fontSize: 22,
      fontWeight: "500",
      opacity: 1,
    },
    defaultFill: {
            backgroundColor: "#FFFFFF",
        },
    fill: {
            ...StyleSheet.absoluteFillObject,
        },
  });
    
    

    