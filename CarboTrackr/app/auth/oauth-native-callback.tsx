import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useOAuth, useAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { color } from "../../shared/constants/colors";

// Required: completes the OAuth session when the browser redirects back
WebBrowser.maybeCompleteAuthSession();

export default function OAuthNativeCallback() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      console.log("✅ [OAuth Callback] Session active, navigating to home.");
      router.replace("/(tabs)");
    } else {
      console.log("❌ [OAuth Callback] No session, navigating to login.");
      router.replace("/auth/login");
    }
  }, [isLoaded, isSignedIn]);

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
