import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ContactScreen from "../../features/contact/components/ContactScreen";
import { color } from "../../shared/constants/colors";

export default function ContactPage() {
  return (
    <SafeAreaView style={styles.safe}>
      <ContactScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.white,
  },
});
