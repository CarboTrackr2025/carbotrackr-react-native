import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { color } from "../../shared/constants/colors";
import { api } from "../../shared/api";

// Required: completes the OAuth session when the browser redirects back
WebBrowser.maybeCompleteAuthSession();

export default function OAuthNativeCallback() {
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    // Wait for both auth AND user to be fully loaded
    if (!authLoaded || !userLoaded) return;

    if (!isSignedIn) {
      console.log("❌ [OAuth Callback] No session, navigating to login.");
      router.replace("/auth/login");
      return;
    }

    if (!user) {
      // isSignedIn is true but user object hasn't populated yet — wait
      console.log("⏳ [OAuth Callback] Waiting for user object to load...");
      return;
    }

    const userId = user.id;
    const email = user.primaryEmailAddress?.emailAddress ?? "";

    console.log(
      "✅ [OAuth Callback] Session active. Persisting user in backend...",
    );
    console.log("   userId:", userId, "| email:", email);

    api
      .post("/auth/account", { userId, email })
      .then(() => {
        console.log("✅ [OAuth Callback] Backend account created/confirmed.");
      })
      .catch((err: any) => {
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
        }
      })
      .finally(() => {
        router.replace("/(tabs)");
      });
  }, [authLoaded, userLoaded, isSignedIn, user]);

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
