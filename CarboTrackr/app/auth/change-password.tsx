import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useUser, useSignIn, useAuth } from "@clerk/clerk-expo";
import ChangePasswordForm from "../../features/auth/components/ChangePasswordForm";
import ResetPasswordForm from "../../features/auth/components/ResetPasswordForm";
import { Toast } from "../../shared/components/Toast";
import { color } from "../../shared/constants/colors";
import {
  changePasswordWithClerk,
  resetPasswordWithClerk,
} from "../../features/auth/api/auth.api";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signIn } = useSignIn();
  const { signOut } = useAuth();
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const isResetFlow = flow === "reset";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // ── Forgot-password reset flow ────────────────────────────────────────────
  const handleReset = async (newPassword: string) => {
    if (!signIn) {
      setError("Clerk is not initialized.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await resetPasswordWithClerk(signIn, newPassword);
    setSubmitting(false);

    if (result.success) {
      setShowToast(true);
    } else {
      setError(result.message);
    }
  };

  // ── Authenticated change-password flow ────────────────────────────────────
  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    if (!user) {
      setError("No authenticated user found. Please log in again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await changePasswordWithClerk(
      user,
      newPassword,
      currentPassword,
    );
    setSubmitting(false);

    if (result.success) {
      setShowToast(true);
    } else {
      setError(result.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>
        {isResetFlow ? (
          <ResetPasswordForm
            submitting={submitting}
            error={error}
            onReset={handleReset}
            onFAQ={() => router.push("/faqs")}
          />
        ) : (
          <ChangePasswordForm
            submitting={submitting}
            error={error}
            onChangePassword={handleChangePassword}
            onFAQ={() => router.push("/faqs")}
          />
        )}
        <Toast
          message="Password changed successfully!"
          visible={showToast}
          type="success"
          duration={600}
          onHide={async () => {
            setShowToast(false);
            await signOut();
            router.replace("/auth/login");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.white,
  },
  inner: {
    flex: 1,
    position: "relative",
  },
});
