import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DisclaimerForm from "../../features/auth/components/DisclaimerForm";
import { color } from "../../shared/constants/colors";

export default function DisclaimerScreen() {
  const router = useRouter();

  const handleAgree = () => {
    console.log("✅ [Disclaimer] User agreed to terms, navigating to profile setup.");
    router.replace("/auth/setup-profile");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <DisclaimerForm onAgree={handleAgree} onFAQ={() => router.push("/faqs")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.white,
  },
});
