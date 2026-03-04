import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import OTPForm from "../../features/auth/components/OTPForm";
import {
  verifyPasswordResetOTP,
  requestPasswordReset,
  verifySignUpEmail,
} from "../../features/auth/api/auth.api";
import { color } from "../../shared/constants/colors";

export default function OTPScreen() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { signUp, setActive } = useSignUp();
  const { flow, email } = useLocalSearchParams<{
    flow?: string;
    email?: string;
  }>();
  const isResetFlow = flow === "reset";
  const isSignupFlow = flow === "signup";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (otp: string) => {
    if (isResetFlow) {
      if (!signIn) {
        setError("Clerk is not initialized.");
        return;
      }

      setSubmitting(true);
      setError(null);

      const result = await verifyPasswordResetOTP(signIn, otp);
      setSubmitting(false);

      if (result.success) {
        console.log(
          "✅ [OTP] OTP verified, navigating to change-password (reset flow)",
        );
        router.replace({
          pathname: "/auth/change-password",
          params: { flow: "reset" },
        });
      } else {
        console.error("❌ [OTP] OTP verification failed:", result.message);
        setError(result.message);
      }
      return;
    }

    if (isSignupFlow) {
      if (!signUp || !setActive) {
        setError("Clerk is not initialized.");
        return;
      }

      setSubmitting(true);
      setError(null);

      const result = await verifySignUpEmail(
        signUp,
        setActive,
        otp,
        email ?? "",
      );
      setSubmitting(false);

      if (result.success) {
        console.log("✅ [OTP] Email verified, navigating to home.");
        router.replace("/(tabs)");
      } else if ("message" in result) {
        console.error("❌ [OTP] Email verification failed:", result.message);
        setError(result.message);
      }
      return;
    }

    console.log("ℹ️ [OTP] No flow specified, no action taken.");
  };

  const handleResend = async () => {
    if (isResetFlow && signIn && email) {
      console.log("🔄 [OTP] Resending password reset OTP to:", email);
      await requestPasswordReset(signIn, email);
    } else if (isSignupFlow && signUp) {
      console.log("🔄 [OTP] Resending sign-up verification OTP.");
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } else {
      console.log(
        "ℹ️ [OTP] Resend requested but no reset flow or email available.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <OTPForm
        submitting={submitting}
        error={error}
        onVerify={handleVerify}
        onResend={handleResend}
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
