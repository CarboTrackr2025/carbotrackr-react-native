import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { color, gradient } from "../../../shared/constants/colors";
import { submitContactInquiry } from "../api/post-contact";
import { GradientTextInput } from "../../../shared/components/GradientTextInput";

const BORDER_W = 2.5;
const RADIUS = 12;

export default function ContactScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim() || !emailAddress.trim()) {
      setError("All fields are required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await submitContactInquiry({
        subject: subject.trim(),
        message: message.trim(),
        email_address: emailAddress.trim(),
      });
      setSuccess(true);
      setSubject("");
      setMessage("");
      setEmailAddress("");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Failed to submit inquiry. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={color.black}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>
          Can't find the answer you're looking for? Send us a message.
        </Text>

        {/* Subject */}
        <Text style={styles.label}>Subject</Text>
        <GradientTextInput
          containerStyle={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Enter subject"
          placeholderTextColor="#9CA3AF"
          iconName="create"
          maxLength={500}
        />

        {/* Email */}
        <Text style={styles.label}>Email Address</Text>
        <GradientTextInput
          containerStyle={styles.input}
          value={emailAddress}
          onChangeText={setEmailAddress}
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          iconName="mail"
        />

        {/* Message */}
        <Text style={styles.label}>Inquiry / Complaint</Text>
        <GradientTextInput
          containerStyle={[styles.input, styles.textArea]}
          inputInnerStyle={styles.messageInputInner}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your concern..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={5}
          iconName="chatbox-ellipses"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {success && (
          <Text style={styles.successText}>
            Your inquiry has been submitted. We will get back to you soon.
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          style={styles.submitPressable}
        >
          {({ pressed }) => {
            return (
              <LinearGradient
                colors={gradient.green as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonBorder}
              >
                <View
                  style={[
                    styles.submitButtonInner,
                    pressed && styles.submitButtonActive,
                    isLoading && styles.submitButtonDisabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color={color.green} />
                  ) : (
                    <Text style={styles.submitText}>Submit</Text>
                  )}
                </View>
              </LinearGradient>
            );
          }}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: color.black,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: color.black,
    marginBottom: 8,
  },
  input: {
    marginBottom: 20,
  },
  textArea: {
    minHeight: 128,
  },
  messageInputInner: {
    alignItems: "flex-start",
    paddingTop: 14,
  },
  submitPressable: {
    marginTop: 8,
  },
  submitButtonBorder: {
    borderRadius: RADIUS,
    padding: BORDER_W,
  },
  submitButtonInner: {
    borderRadius: RADIUS - BORDER_W,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.white,
  },
  submitButtonActive: {
    backgroundColor: color["light-green-2"],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: color.green,
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: color.red,
    fontSize: 13,
    marginBottom: 12,
  },
  successText: {
    color: color.green,
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
});
