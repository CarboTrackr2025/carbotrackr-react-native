import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";
import ForgotPasswordForm from "../../features/auth/components/ForgotPasswordForm";
import { requestPasswordReset } from "../../features/auth/api/auth.api";
import { color } from "../../shared/constants/colors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (email: string) => {
    if (!signIn) {
      setError("Clerk is not initialized.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await requestPasswordReset(signIn, email);
    setSubmitting(false);

    if (result.success) {
      console.log("✅ [ForgotPassword] OTP sent, navigating to OTP screen");
      router.push({ pathname: "/auth/otp", params: { flow: "reset", email } });
    } else {
      console.error(
        "❌ [ForgotPassword] Reset request failed:",
        result.message,
      );
      setError(result.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ForgotPasswordForm
        submitting={submitting}
        error={error}
        onSend={handleSend}
        onFAQ={() => router.push("/faqs")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.white,
  },
});
