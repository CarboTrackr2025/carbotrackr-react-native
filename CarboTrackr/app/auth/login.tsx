import React, { useState, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSignIn, useOAuth, useUser } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import LoginForm from "../../features/auth/components/LoginForm";
import { loginWithClerk } from "../../features/auth/api/auth.api";
import { saveClerkSession } from "../../features/auth/auth.utils";
import { color } from "../../shared/constants/colors";
import { api } from "../../shared/api";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, setActive } = useSignIn();
  const { user } = useUser();
  const pendingSessionId = useRef<string | null>(null);
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({
    strategy: "oauth_facebook",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Once Clerk updates user after login, save the session with the real userId
  useEffect(() => {
    if (user?.id && pendingSessionId.current) {
      const sessionId = pendingSessionId.current;
      pendingSessionId.current = null;
      console.log("💾 [Login Screen] useUser resolved userId:", user.id);
      saveClerkSession({ sessionId, userId: user.id }).then(() => {
        console.log("💾 [Login Screen] Session saved to AsyncStorage");
        router.replace("/(tabs)");
      });
    }
  }, [user?.id]);

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
      console.log("✅ [Login Screen] Login successful, waiting for user context...");
      pendingSessionId.current = result.sessionId;
      // Navigation will happen in the useEffect above once user.id is available
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
      const redirectUrl = Linking.createURL("/auth/oauth-native-callback");
      const {
        createdSessionId,
        setActive: oAuthSetActive,
        signUp: oAuthSignUp,
        signIn: oAuthSignIn,
      } = await startOAuthFlow({ redirectUrl });

      if (createdSessionId && oAuthSetActive) {
        await oAuthSetActive({ session: createdSessionId });
        console.log(
          "✅ [Login Screen] OAuth login successful, persisting to backend...",
        );

        // Resolve userId — new signups have it on signUp, returning users on signIn
        const userId =
          oAuthSignUp?.createdUserId ??
          (oAuthSignIn as any)?.createdUserId ??
          null;
        const email =
          oAuthSignUp?.emailAddress ??
          (oAuthSignIn as any)?.identifier ??
          null;

        // Always save the session locally
        if (userId) {
          await saveClerkSession({ sessionId: createdSessionId, userId });
          console.log("💾 [Login Screen] Session saved to AsyncStorage");
        }

        if (userId && email) {
          console.log("🌐 [Login Screen] Persisting new OAuth user:", {
            userId,
            email,
          });
          try {
            await api.post("/auth/account", { userId, email });
            console.log("✅ [Login Screen] Backend account created/confirmed.");
          } catch (backendErr: any) {
            if (backendErr?.response?.status === 409) {
              console.warn(
                "⚠️ [Login Screen] Backend account already exists (409). Continuing.",
              );
            } else {
              console.error(
                "❌ [Login Screen] Failed to persist backend account:",
                backendErr?.message,
              );
            }
          }
        } else {
          console.log(
            "ℹ️ [Login Screen] Existing OAuth user — no backend persist needed.",
          );
        }

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
