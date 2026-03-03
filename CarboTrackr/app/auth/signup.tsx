import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import SignupForm from "../../features/auth/components/SignupForm";
import { signUpWithClerk } from "../../features/auth/api/auth.api";
import { color } from "../../shared/constants/colors";

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({
    strategy: "oauth_facebook",
  });
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

    const result = await signUpWithClerk(signUp, setActive, {
      email,
      password,
    });
    setSubmitting(false);

    if (result.success) {
      console.log("✅ [Signup Screen] Sign-up successful! Navigating to home.");
      router.replace("/(tabs)");
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
  };

  const handleOAuth = async (provider: "oauth_google" | "oauth_facebook") => {
    console.log("📱 [Signup Screen] OAuth button pressed:", provider);

    setSubmitting(true);
    setError(null);

    try {
      const startOAuthFlow =
        provider === "oauth_google" ? startGoogleOAuth : startFacebookOAuth;
      const redirectUrl = Linking.createURL("/oauth-native-callback");
      const { createdSessionId, setActive: oAuthSetActive } =
        await startOAuthFlow({ redirectUrl });

      if (createdSessionId && oAuthSetActive) {
        await oAuthSetActive({ session: createdSessionId });
        console.log("✅ [Signup Screen] OAuth sign-up successful");
        router.replace("/(tabs)");
      } else {
        console.log("✅ [Signup Screen] OAuth flow initiated");
      }
    } catch (err: any) {
      console.error("❌ [Signup Screen] OAuth failed:", err);
      const message =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        err?.message ??
        "OAuth sign-in failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <SignupForm
        submitting={submitting}
        error={error}
        onSignUp={handleSignUp}
        onLogin={() => router.replace("/auth/login")}
        onFacebook={() => handleOAuth("oauth_facebook")}
        onGoogle={() => handleOAuth("oauth_google")}
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
