import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { color } from "../../shared/constants/colors";
import { api } from "../../shared/api";
import { saveClerkSession } from "../../features/auth/auth.utils";

// Required: completes the OAuth session when the browser redirects back
WebBrowser.maybeCompleteAuthSession();

export default function OAuthNativeCallback() {
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded, sessionId } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Wait for both auth AND user to be fully loaded
    if (!authLoaded || !userLoaded) return;
    // Prevent double-navigation
    if (hasNavigated.current) return;

    if (!isSignedIn || !sessionId) {
      console.log("❌ [OAuth Callback] No session, navigating to login.");
      hasNavigated.current = true;
      router.replace("/auth/login");
      return;
    }

    if (!user) {
      // isSignedIn is true but user object hasn't populated yet — keep waiting
      console.log("⏳ [OAuth Callback] Waiting for user object to load...");
      return;
    }

    const userId = user.id;
    const email = user.primaryEmailAddress?.emailAddress ?? "";

    console.log(
      "✅ [OAuth Callback] Session active. Persisting user in backend...",
    );
    console.log("   userId:", userId, "| email:", email);

    // Determine if this is a new user (no external accounts means Clerk just created them)
    // Clerk exposes createdAt – if it's very recent (within 30s) treat as new
    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
    let isNewUser = Date.now() - createdAt < 30_000;

    const persist = async () => {
      // Always save the session to AsyncStorage
      await saveClerkSession({ sessionId, userId });
      console.log("💾 [OAuth Callback] Session saved to AsyncStorage");

      // Persist user in backend (upsert — 409 = already exists, that's fine)
      try {
        const response = await api.post("/auth/account", { userId, email });
        console.log("✅ [OAuth Callback] Backend account created/confirmed.");
        if (response.status === 201) {
          isNewUser = true; // explicitly new in our DB
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 409) {
          console.warn(
            "⚠️ [OAuth Callback] Backend account already exists (409). Continuing.",
          );
        } else {
          console.error(
            "❌ [OAuth Callback] Failed to persist backend account:",
            err?.message,
            "| status:",
            status,
            "| baseURL:",
            api.defaults.baseURL,
          );
          // Non-fatal: continue navigation even if backend persist fails
        }
      }

      hasNavigated.current = true;
      if (isNewUser) {
        console.log(
          "🆕 [OAuth Callback] New user — navigating to profile setup.",
        );
        router.replace("/auth/setup-profile");
      } else {
        console.log("🔄 [OAuth Callback] Returning user — navigating to tabs.");
        router.replace("/(tabs)");
      }
    };

    persist();
  }, [authLoaded, userLoaded, isSignedIn, sessionId, user]);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={color.green} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.white,
  },
});
