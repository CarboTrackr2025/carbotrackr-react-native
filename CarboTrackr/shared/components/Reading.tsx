import React from "react"
import {StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle} from "react-native"
import {LinearGradient} from "expo-linear-gradient"
import {gradient as appGradient} from "../constants/colors"
import { Dimensions } from "react-native";

type Props = {
  text: string
  colors?: [string, string]
  containerStyle?: StyleProp<ViewStyle>
  innerStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  numberOfLines?: number
  unit: "g" | "kg" | "calories" | "minutes" | "mmHg" | "mgDl" 
}

export function Reading({
  text,
  colors = appGradient.green as [string, string],
  containerStyle,
  innerStyle,
  textStyle,
  numberOfLines,
  unit
}: Props) {
  return (
      <LinearGradient
        colors={colors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.container, containerStyle]}
      >
        <View style={[styles.inner, innerStyle]}>
            <View style={[styles.defaultFill, styles.fill]}/>
            <Text
                style={[styles.text, textStyle]}
                numberOfLines={numberOfLines}
                ellipsizeMode="tail"
            >
                {text}
            </Text>
            <Text style={[styles.text, textStyle, {fontSize: 20, opacity: 0.6}]}>
                {` ${unit === "kg" ? "kg remaining" : unit === "g" ? "grams remaining" : unit === "calories" ? "calories remaining" : unit === "minutes" ? "active minutes" : unit === "mmHg" ? "mmHg" : unit === "mgDl" ? "mg/dL" : ""}`}
            </Text>
        </View>
      </LinearGradient>
    )
  }
  
  const BORDER_W = 2.5
  const RADIUS = 12

  const { width } = Dimensions.get("window");
  
  const styles = StyleSheet.create({
    container: {
        height: width * 0.6,
        width: width * 0.6,
        borderRadius: 200,
        padding: 2.5,
        justifyContent: "center",
        overflow: "hidden",
    },
    inner: {
        flex: 1,
        borderRadius: 200,
        justifyContent: "center",
        paddingHorizontal: 12,
        overflow: "hidden",
        alignContent: "center",
    },
    text: {
      color: "#111827",
      fontSize: 30,
      opacity: 0.8,
        alignItems: "center",
        textAlign: "center",
    },
    defaultFill: {
            backgroundColor: "#FFFFFF",
        },
    fill: {
            ...StyleSheet.absoluteFillObject,
        },
  });
    
    

    