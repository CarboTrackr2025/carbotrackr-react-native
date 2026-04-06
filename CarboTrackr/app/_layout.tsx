import { useEffect } from "react";
import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import * as Notifications from "expo-notifications";
import { tokenCache } from "../features/auth/auth.utils";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    }, []);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="auth/login" options={{ gestureEnabled: false }} />
        <Stack.Screen name="auth/signup" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="auth/forgot-password"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="auth/otp" />
        <Stack.Screen name="auth/change-password" />
        <Stack.Screen name="auth/oauth-native-callback" />
        <Stack.Screen
          name="auth/setup-profile"
          options={{ gestureEnabled: false }}
        />
      </Stack>
    </ClerkProvider>
  );
}
