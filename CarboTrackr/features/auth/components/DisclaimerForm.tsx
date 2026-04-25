import React, { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { color, gradient } from "../../../shared/constants/colors";

type Props = {
  onAgree: () => void;
  onFAQ: () => void;
  onBack: () => void;
};

export default function DisclaimerForm({ onAgree, onFAQ, onBack }: Props) {
  const [checkedMedical, setCheckedMedical] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const bothChecked = checkedMedical && checkedTerms;

  const handleBack = () => {
    setRedirecting(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      onBack();
    }, 2500);
  };

  useEffect(() => {
    return () => {
      setRedirecting(false);
    };
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={color.black} />
        </TouchableOpacity>
        <Text style={styles.headerBrand}>CarboTrackr</Text>
        <TouchableOpacity onPress={onFAQ} style={styles.faqButton}>
          <Ionicons name="help-circle-outline" size={28} color={color.black} />
        </TouchableOpacity>
      </View>

      {/* ── TITLE ── */}
      <Text style={styles.heading}>Disclaimer</Text>
      <Text style={styles.subheading}>A quick note about your health</Text>

      {/* ── DISCLAIMER BOX ── */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          CarboTrackr helps you estimate and track your carbohydrate intake using
          AI.
        </Text>

        <Text style={styles.disclaimerText}>
          However, it is not a medical device and does not replace professional
          medical advice, diagnosis, or treatment.
        </Text>

        <Text style={styles.disclaimerText}>
          Always consult a qualified healthcare provider for decisions regarding
          your health.
        </Text>

        <Text style={styles.disclaimerEmphasis}>
          Think of CarboTrackr as a guide, not a doctor.
        </Text>
      </View>

      {/* ── CHECKBOXES ── */}
      <View style={styles.checkboxSection}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setCheckedMedical((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, checkedMedical && styles.checkboxChecked]}>
            {checkedMedical && (
              <Ionicons name="checkmark" size={14} color={color.white} />
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand that CarboTrackr is a supplementary tool and not a
            substitute for professional medical advice.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setCheckedTerms((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, checkedTerms && styles.checkboxChecked]}>
            {checkedTerms && (
              <Ionicons name="checkmark" size={14} color={color.white} />
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to the Terms &amp; Conditions and Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── AGREE BUTTON ── */}
      <View style={styles.buttonWrapper}>
        {bothChecked ? (
          <TouchableOpacity onPress={onAgree} activeOpacity={0.85}>
            <LinearGradient
              colors={gradient.green as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonTextActive}>Agree &amp; Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={[styles.button, styles.buttonDisabled]}>
            <Text style={styles.buttonTextDisabled}>Agree &amp; Continue</Text>
          </View>
        )}
      </View>
      </ScrollView>

      {/* ── REDIRECTING OVERLAY ── */}
      {redirecting && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <View style={styles.overlayCard}>
            <Ionicons name="heart-outline" size={40} color={color.green} style={{ marginBottom: 12 }} />
            <Text style={styles.overlayTitle}>We understand. 💚</Text>
            <Text style={styles.overlayMessage}>
              Thank you for considering CarboTrackr. We're redirecting you back
              to the login page. You may also close the application at any time.
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.white,
  },
  scroll: {
    flex: 1,
    backgroundColor: color.white,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  backButton: {
    padding: 4,
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
    fontSize: 22,
    fontWeight: "800",
    color: color.black,
    textAlign: "center",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 28,
  },
  disclaimerBox: {
    borderWidth: 1.5,
    borderColor: color.green,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    marginBottom: 32,
  },
  disclaimerText: {
    fontSize: 15,
    color: color.black,
    lineHeight: 22,
  },
  disclaimerEmphasis: {
    fontSize: 15,
    fontWeight: "800",
    fontStyle: "italic",
    color: color.black,
    lineHeight: 22,
  },
  checkboxSection: {
    gap: 18,
    marginBottom: 32,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#C5C5C5",
    backgroundColor: color.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: color.green,
    borderColor: color.green,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: "#444",
    lineHeight: 19,
  },
  buttonWrapper: {
    marginTop: 4,
  },
  button: {
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  buttonTextActive: {
    fontSize: 15,
    fontWeight: "700",
    color: color.white,
  },
  buttonTextDisabled: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  overlayCard: {
    alignItems: "center",
    backgroundColor: color.white,
    borderRadius: 20,
    padding: 32,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    width: "100%",
  },
  overlayTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: color.black,
    marginBottom: 10,
    textAlign: "center",
  },
  overlayMessage: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    textAlign: "center",
  },
});
