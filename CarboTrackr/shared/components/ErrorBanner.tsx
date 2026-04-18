import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  message: string | null | undefined;
};

/**
 * A compact, friendly inline error banner.
 * Renders nothing when `message` is falsy.
 */
export function ErrorBanner({ message }: Props) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 8,
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: "#B91C1C",
    lineHeight: 18,
    fontWeight: "500",
  },
});
