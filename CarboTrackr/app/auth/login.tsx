import React, { useState, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSignIn, useUser, useAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import LoginForm from "../../features/auth/components/LoginForm";
import { loginWithClerk } from "../../features/auth/api/auth.api";
import { saveClerkSession } from "../../features/auth/auth.utils";
import { color } from "../../shared/constants/colors";
import { api } from "../../shared/api";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, setActive } = useSignIn();
  const { sessionId } = useAuth();
  const { user } = useUser();
  const pendingSessionId = useRef<string | null>(null);
  const isPersistingRef = useRef(false);
  const handledSessionIdRef = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeNavigateToTabs = (context: string) => {
    try {
      router.replace("/(tabs)");
      return true;
    } catch (navErr: any) {
      console.error(
        `❌ [Login Screen] Navigation to tabs failed (${context}):`,
        navErr?.message,
      );
      setError(
        "You're signed in, but we hit a snag opening the app. Give it another try!",
      );
      return false;
    }
  };

  const resolveUserEmail = () => {
    return (
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      ""
    );
  };

  const persistAccountAndNavigate = async (
    resolvedSessionId: string,
    userId: string,
    email: string,
    forceSetup = false,
  ) => {
    await saveClerkSession({ sessionId: resolvedSessionId, userId });
    console.log("💾 [Login Screen] Session saved to AsyncStorage");

    const response = await api.post("/auth/account", {
      userId,
      email,
    });

    if (forceSetup || response.status === 201) {
      router.replace("/auth/setup-profile");
      return;
    }

    router.replace("/(tabs)");
  };

  // Handle both fresh logins and users who are already signed in but still on this screen.
  useEffect(() => {
    if (!user?.id) return;

    const resolvedSessionId = pendingSessionId.current ?? sessionId ?? null;
    if (!resolvedSessionId) return;
    if (handledSessionIdRef.current === resolvedSessionId) return;
    if (isPersistingRef.current) return;

    // Already signed-in user visiting login page: redirect immediately.
    // No need to block this path on backend account upsert.
    if (!pendingSessionId.current) {
      try {
        handledSessionIdRef.current = resolvedSessionId;
        safeNavigateToTabs("already-signed-in");
      } catch (err: any) {
        console.error(
          "❌ [Login Screen] Already-signed-in redirect failed:",
          err?.message,
        );
        handledSessionIdRef.current = null;
        setError(
          "You're already signed in — give us a second to redirect you!",
        );
      }
      return;
    }

    isPersistingRef.current = true;
    pendingSessionId.current = null;

    const email = resolveUserEmail();
    if (!email) {
      isPersistingRef.current = false;
      setError(
        "Hang tight — we're still loading your account details. Try again in a moment.",
      );
      return;
    }

    console.log("🌐 [Login Screen] Checking/persisting backend user:", {
      userId: user.id,
      email,
    });

    persistAccountAndNavigate(resolvedSessionId, user.id, email)
      .then(() => {
        handledSessionIdRef.current = resolvedSessionId;
      })
      .catch((err: any) => {
        const status = err?.response?.status;
        if (status === 409) {
          console.log(
            "✅ [Login Screen] Backend account already exists (409).",
          );
          handledSessionIdRef.current = resolvedSessionId;
          safeNavigateToTabs("post-login-409");
          return;
        }

        console.warn(
          "⚠️ [Login Screen] Post-login persistence failed. Continuing with signed-in session:",
          err?.message,
        );
        handledSessionIdRef.current = resolvedSessionId;
        setError(null);
        safeNavigateToTabs("post-login-persist-failed");
      })
      .finally(() => {
        isPersistingRef.current = false;
      });
  }, [
    user?.id,
    user?.primaryEmailAddress?.emailAddress,
    user?.emailAddresses,
    sessionId,
    router,
  ]);

  const handleLogin = async (email: string, password: string) => {
    console.log("📱 [Login Screen] Login button pressed");
    console.log("   Email:", email);

    if (!signIn || !setActive) {
      console.error(
        "❌ [Login Screen] Clerk signIn or setActive not available",
      );
      setError("Authentication isn't ready yet — please wait a second and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await loginWithClerk(signIn, setActive, {
        email,
        password,
      });

      if (result.success) {
        console.log(
          "✅ [Login Screen] Login successful, waiting for user context...",
        );
        pendingSessionId.current = result.sessionId;
        // Navigation will happen in the useEffect above once user.id is available
      } else {
        console.error("❌ [Login Screen] Login failed:", result.message);
        setError(result.message);
      }
    } catch (err: any) {
      console.error("❌ [Login Screen] Unexpected login error:", err?.message);
      setError(err?.message ?? "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // OAuth temporarily disabled
  // const handleOAuth = async (provider: "oauth_google" | "oauth_facebook") => {
  //   console.log("📱 [Login Screen] OAuth button pressed:", provider);
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
      <LoginForm
        submitting={submitting}
        error={error}
        onLogin={handleLogin}
        onForgotPassword={() => router.push("/auth/forgot-password")}
        onSignUp={() => router.push("/auth/signup")}
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
