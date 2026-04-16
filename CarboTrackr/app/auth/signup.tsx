import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import SignupForm from "../../features/auth/components/SignupForm";
import { signUpWithClerk } from "../../features/auth/api/auth.api";
import { color } from "../../shared/constants/colors";

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (email: string, password: string) => {
    console.log("📱 [Signup Screen] Sign-up button pressed for:", email);

    if (!isLoaded || !signUp || !setActive) {
      console.error("❌ [Signup Screen] Clerk useSignUp not ready");
      setError("Authentication service is not ready. Please try again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await signUpWithClerk(signUp, setActive, {
        email,
        password,
      });

      if (result.success) {
        console.log(
          "✅ [Signup Screen] Sign-up successful! Navigating to profile setup.",
        );
        router.replace("/auth/setup-profile");
      } else if ("needsVerification" in result && result.needsVerification) {
        console.log(
          "📧 [Signup Screen] Email verification required, navigating to OTP.",
        );
        router.push({
          pathname: "/auth/otp",
          params: { flow: "signup", email: result.email },
        });
      } else if ("message" in result) {
        console.error("❌ [Signup Screen] Sign-up failed:", result.message);
        setError(result.message);
      }
    } catch (err: any) {
      console.error(
        "❌ [Signup Screen] Unexpected sign-up error:",
        err?.message,
      );
      setError(err?.message ?? "Sign-up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // OAuth temporarily disabled
  // const handleOAuth = async (provider: "oauth_google" | "oauth_facebook") => {
  //   console.log("📱 [Signup Screen] OAuth button pressed:", provider);
  //   setSubmitting(true);
  //   setError(null);
  //   try {
  //     // OAuth flow intentionally disabled for now.
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  return (
    <SafeAreaView style={styles.safe}>
      <SignupForm
        submitting={submitting}
        error={error}
        onSignUp={handleSignUp}
        onLogin={() => router.replace("/auth/login")}
        onFacebook={() => setError("OAuth is temporarily disabled.")}
        onGoogle={() => setError("OAuth is temporarily disabled.")}
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
