import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import DisclaimerForm from "../../features/auth/components/DisclaimerForm";
import { color } from "../../shared/constants/colors";
import { clearAllAuth } from "../../features/auth/auth.utils";

export default function DisclaimerScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleAgree = () => {
    console.log("✅ [Disclaimer] User agreed to terms, navigating to profile setup.");
    router.replace("/auth/setup-profile");
  };

  const handleBack = async () => {
    console.log("⬅️ [Disclaimer] User declined — signing out and clearing tokens.");
    try {
      // Kill the active Clerk session (created during OTP verification)
      await signOut();
      console.log("✅ [Disclaimer] Clerk session signed out.");
    } catch (err) {
      console.warn("⚠️ [Disclaimer] signOut error (non-fatal):", err);
    }
    // Wipe any locally stored tokens as a safety net
    await clearAllAuth();
    console.log("🗑️ [Disclaimer] Local auth tokens cleared.");
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <DisclaimerForm onAgree={handleAgree} onFAQ={() => router.push("/faqs")} onBack={handleBack} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.white,
  },
});
