import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import FAQsScreen from "../../features/faqs/components/FAQsScreen";
import { color } from "../../shared/constants/colors";

export default function FAQsPage() {
  return (
    <SafeAreaView style={styles.safe}>
      <FAQsScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.white,
  },
});
