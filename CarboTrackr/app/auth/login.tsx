import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import LoginForm from "../../features/auth/components/LoginForm";
import { loginWithClerk } from "../../features/auth/api/auth.api";
import { color } from "../../shared/constants/colors";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, setActive } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({
    strategy: "oauth_facebook",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    console.log("📱 [Login Screen] Login button pressed");
    console.log("   Email:", email);

    if (!signIn || !setActive) {
      console.error(
        "❌ [Login Screen] Clerk signIn or setActive not available",
      );
      setError("Clerk is not initialized.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await loginWithClerk(signIn, setActive, { email, password });
    setSubmitting(false);

    if (result.success) {
      console.log("✅ [Login Screen] Login successful, navigating to home");
      router.replace("/(tabs)");
    } else {
      console.error("❌ [Login Screen] Login failed:", result.message);
      setError(result.message);
    }
  };

  const handleOAuth = async (provider: "oauth_google" | "oauth_facebook") => {
    console.log("📱 [Login Screen] OAuth button pressed:", provider);

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
        console.log("✅ [Login Screen] OAuth login successful");
        router.replace("/(tabs)");
      } else {
        console.log("✅ [Login Screen] OAuth flow initiated");
      }
    } catch (err: any) {
      console.error("❌ [Login Screen] OAuth failed:", err);
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
      <LoginForm
        submitting={submitting}
        error={error}
        onLogin={handleLogin}
        onForgotPassword={() => router.push("/auth/forgot-password")}
        onSignUp={() => router.push("/auth/signup")}
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
