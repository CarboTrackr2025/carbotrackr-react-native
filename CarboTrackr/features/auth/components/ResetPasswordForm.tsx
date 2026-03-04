import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, gradient } from "../../../shared/constants/colors";
import { GradientTextInput } from "../../../shared/components/GradientTextInput";
import { Button } from "../../../shared/components/Button";

type Props = {
  submitting?: boolean;
  error?: string | null;
  onReset: (newPassword: string) => void | Promise<void>;
  onFAQ: () => void;
};

const isStrongPassword = (password: string): boolean => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasNumber && hasSymbol;
};

export default function ResetPasswordForm({
  submitting = false,
  error,
  onReset,
  onFAQ,
}: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const canSubmit =
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    !submitting;

  const handleReset = () => {
    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setValidationError(
        "Password must include uppercase, lowercase, a number, and a symbol.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }
    setValidationError(null);
    onReset(newPassword);
  };

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.headerBrand}>CarboTrackr</Text>
        <TouchableOpacity onPress={onFAQ} style={styles.faqButton}>
          <Ionicons name="help-circle-outline" size={28} color={color.black} />
        </TouchableOpacity>
      </View>

      {/* ── HEADLINE ── */}
      <Text style={styles.heading}>New Password</Text>

      {/* ── SUBHEADLINE ── */}
      <Text style={styles.subheading}>
        Enter and confirm your new password below.
      </Text>

      {/* ── NEW PASSWORD ── */}
      <Text style={styles.label}>New Password</Text>
      <View style={styles.passwordInputWrapper}>
        <GradientTextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="••••••••"
          secureTextEntry={!showNewPassword}
          iconName="lock-closed-outline"
          iconSize={1}
          iconColor="transparent"
        />
        <TouchableOpacity
          style={styles.eyeOverlay}
          onPress={() => setShowNewPassword((prev) => !prev)}
        >
          <Ionicons
            name={showNewPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={color.black}
          />
        </TouchableOpacity>
      </View>

      {/* ── CONFIRM PASSWORD ── */}
      <Text style={styles.label}>Confirm Password</Text>
      <View style={styles.passwordInputWrapper}>
        <GradientTextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry={!showConfirmPassword}
          iconName="lock-closed-outline"
          iconSize={1}
          iconColor="transparent"
        />
        <TouchableOpacity
          style={styles.eyeOverlay}
          onPress={() => setShowConfirmPassword((prev) => !prev)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={color.black}
          />
        </TouchableOpacity>
      </View>

      {/* ── ERRORS ── */}
      <View style={styles.errorContainer}>
        {validationError ? (
          <Text style={styles.errorText}>{validationError}</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>

      {/* ── RESET BUTTON ── */}
      <View style={styles.buttonWrapper}>
        <Button
          title={submitting ? "Saving..." : "Save Password"}
          onPress={handleReset}
          gradient={gradient.green as [string, string]}
          disabled={!canSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: color.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  headerBrand: {
    fontSize: 20,
    fontWeight: "700",
    color: color.green,
  },
  faqButton: {
    padding: 4,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: color.black,
    marginTop: 16,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 28,
    lineHeight: 22,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: "600",
    color: color.black,
  },
  passwordInputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  eyeOverlay: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  errorContainer: {
    minHeight: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  errorText: {
    color: color["red"],
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  buttonWrapper: {
    marginTop: 16,
  },
});
