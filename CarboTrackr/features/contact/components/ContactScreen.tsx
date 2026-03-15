import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { color } from "../../../shared/constants/colors";
import { submitContactInquiry } from "../api/post-contact";

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
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Enter subject"
          placeholderTextColor="#aaa"
          maxLength={500}
        />

        {/* Email */}
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={emailAddress}
          onChangeText={setEmailAddress}
          placeholder="Enter your email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Message */}
        <Text style={styles.label}>Inquiry / Complaint</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your concern..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {success && (
          <Text style={styles.successText}>
            Your inquiry has been submitted. We will get back to you soon.
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={color.white} />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
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
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: color.black,
    marginBottom: 20,
    backgroundColor: "#fafafa",
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: color.green,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: color.white,
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
