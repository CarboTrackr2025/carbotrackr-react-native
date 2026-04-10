import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

import AddBloodGlucoseForm from "../../../features/health/components/AddBloodGlucoseForm";
import {
  BloodGlucoseInput,
  CreateBloodGlucosePayload,
  createBloodGlucose,
} from "../../../features/health/api/post-blood-glucose";
import {
  DiagnosedWith,
  getLatestDiagnosis,
} from "../../../features/health/api/get-latest-diagnosis";
import { color, gradient } from "../../../shared/constants/colors";

const evaluateBloodGlucose = (
  level: number,
  mealContext: "PRE" | "POST",
  diagnosis: DiagnosedWith | null,
): string => {
  const diagnosisContext =
    diagnosis === "TYPE_2_DIABETES"
      ? "Given your Type 2 diabetes diagnosis, follow your care plan and contact your clinician if readings stay outside your target range.\n\n"
      : diagnosis === "PRE_DIABETES"
        ? "Given your prediabetes diagnosis, continue monitoring and discuss trends with your healthcare provider.\n\n"
        : "";

  if (level >= 300) {
    return (
      "Alert: Your blood glucose is critically high (>=300 mg/dL).\n\n" +
      diagnosisContext +
      "Seek medical attention, especially if you have symptoms such as excessive thirst, " +
      "frequent urination, blurred vision, or fatigue."
    );
  }

  if (mealContext === "PRE") {
    if (level >= 126) {
      return (
        "Alert: Your pre-meal blood glucose is high (>=126 mg/dL).\n\n" +
        diagnosisContext +
        "This may indicate diabetes. Contact your healthcare provider for further evaluation."
      );
    }
    if (level >= 100) {
      return (
        "Alert: Your pre-meal blood glucose is elevated (100-125 mg/dL).\n\n" +
        diagnosisContext +
        "This may indicate prediabetes. Consider lifestyle changes and consult your healthcare provider."
      );
    }
    if (level >= 70) {
      return "Your pre-meal blood glucose is in the normal range (70-99 mg/dL).";
    }
  } else {
    if (level >= 200) {
      return (
        "Alert: Your post-meal blood glucose is high (200-299 mg/dL).\n\n" +
        diagnosisContext +
        "This may indicate diabetes. Contact your healthcare provider for further evaluation."
      );
    }
    if (level >= 140) {
      return (
        "Alert: Your post-meal blood glucose is elevated (140-199 mg/dL).\n\n" +
        diagnosisContext +
        "This may indicate prediabetes. Consider lifestyle changes and consult your healthcare provider."
      );
    }
    if (level >= 70) {
      return "Your post-meal blood glucose is in the normal range (70-139 mg/dL).";
    }
  }

  return (
    "Alert: Your blood glucose is low (<70 mg/dL).\n\n" +
    diagnosisContext +
    "Please consume a fast-acting carbohydrate and rest. Seek medical attention if symptoms persist."
  );
};

export default function AddBloodGlucoseScreen() {
  const { userId } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [recordedTimestamp, setRecordedTimestamp] = useState<string | null>(
    null,
  );
  const [diagnosis, setDiagnosis] = useState<DiagnosedWith | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState("");

  const closeModal = () => setModalVisible(false);

  const resolveDiagnosis = async (accountId: string) => {
    if (diagnosis) return diagnosis;

    try {
      const { diagnosed_with } = await getLatestDiagnosis(accountId);
      setDiagnosis(diagnosed_with);
      return diagnosed_with;
    } catch (error) {
      // Diagnosis context is optional for alerts; continue with generic guidance.
      console.log("Diagnosis lookup failed", error);
      return null;
    }
  };

  const handleSubmit = async (values: BloodGlucoseInput) => {
    try {
      setSubmitting(true);

      const accountIdFromClerk = userId;
      if (!accountIdFromClerk) {
        throw new Error("User ID from Clerk Auth API not found");
      }

      const payload: CreateBloodGlucosePayload = {
        ...values,
        account_id: accountIdFromClerk,
      };

      const diagnosisForAlert = await resolveDiagnosis(accountIdFromClerk);
      const { timestamp } = await createBloodGlucose(payload);
      setRecordedTimestamp(timestamp);

      setModalTitle("Blood Glucose Recorded");
      setModalBody(
        evaluateBloodGlucose(Number(values.level), values.meal_context, diagnosisForAlert),
      );
      setModalVisible(true);
    } catch (err) {
      console.log(err);
      setModalTitle("Unable to Save Reading");
      setModalBody("Blood glucose could not be recorded. Please try again.");
      setModalVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalBody}>{modalBody}</Text>
            <Pressable style={styles.modalButton} onPress={closeModal}>
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AddBloodGlucoseForm
        submitting={submitting}
        onSubmit={handleSubmit}
        timestamp={recordedTimestamp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: color.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: color.white,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: color.black,
    textAlign: "center",
  },
  modalBody: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    lineHeight: 20,
  },
  modalButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: gradient.green[1],
  },
  modalButtonText: {
    color: color.white,
    fontWeight: "600",
  },
});
