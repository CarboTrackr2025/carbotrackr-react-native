import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import AddBloodPressureForm from "../../../features/health/components/AddBloodPressureForm";

import {
    BloodPressureInput,
    CreateBloodPressurePayload,
    createBloodPressure,
} from "../../../features/health/api/post-blood-pressure";
import { useAuth } from "@clerk/clerk-expo";
import { color, gradient } from "../../../shared/constants/colors";
import {
  DiagnosedWith,
  getLatestDiagnosis,
} from "../../../features/health/api/get-latest-diagnosis";

const evaluateBloodPressure = (
  systolic: number,
  diastolic: number,
  diagnosis: DiagnosedWith | null,
): string => {
  const diagnosisContext =
    diagnosis === "TYPE_2_DIABETES"
      ? "Given your Type 2 diabetes diagnosis, blood pressure control is especially important to lower complications risk.\n\n"
      : diagnosis === "PRE_DIABETES"
        ? "Given your prediabetes diagnosis, keeping blood pressure in range supports better long-term metabolic health.\n\n"
        : "";

  if (systolic < 90 || diastolic < 60) {
    return (
      "Alert: Your blood pressure is low.\n\n" +
      diagnosisContext +
      "Please rest, stay hydrated, and consult your doctor if you experience dizziness, fainting, " +
      "or other concerning symptoms."
    );
  }
  if (systolic > 180 || diastolic > 120) {
    return (
      "Alert: Your blood pressure is in the severe hypertension range.\n\n" +
      diagnosisContext +
      "Contact your healthcare professional promptly. If you have chest pain, shortness of breath, " +
      "severe headache, weakness, vision changes, or difficulty speaking, call emergency services right away."
    );
  }
  if (systolic >= 140 || diastolic >= 90) {
    return (
      "Alert: Your blood pressure is high (hypertension stage 2).\n\n" +
      diagnosisContext +
      "Follow your treatment plan and contact your healthcare provider for guidance."
    );
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return (
      "Alert: Your blood pressure is high (hypertension stage 1).\n\n" +
      diagnosisContext +
      "Monitor your readings and discuss management options with your healthcare provider."
    );
  }
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return (
      "Alert: Your blood pressure is elevated.\n\n" +
      diagnosisContext +
      "Consider lifestyle measures and continue monitoring. Consult your healthcare provider if concerned."
    );
  }
  if (systolic < 120 && diastolic < 80) {
    return "Your blood pressure is in the normal range.";
  }
  return (
    "Your blood pressure reading is outside the typical categories. " +
    "Consider rechecking and consult your healthcare provider for personalized advice."
  );
};

export default function AddBloodPressureScreen() {
  const { userId } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [recordedTimestamp, setRecordedTimestamp] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState("");
  const [diagnosis, setDiagnosis] = useState<DiagnosedWith | null>(null);

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

  const handleSubmit = async (values: BloodPressureInput) => {
    try {
      setSubmitting(true);

      const accountIdFromClerk = userId;
      if (!accountIdFromClerk) {
        throw new Error("User ID from Clerk Auth API not found");
      }
      const payload: CreateBloodPressurePayload = {
        ...values,
        account_id: accountIdFromClerk,
      };

      const diagnosisForAlert = await resolveDiagnosis(accountIdFromClerk);
      const { timestamp } = await createBloodPressure(payload);
      setRecordedTimestamp(timestamp);
      setModalTitle("Blood Pressure Recorded");
      setModalBody(
        evaluateBloodPressure(
          values.systolic_mmHg,
          values.diastolic_mmHg,
          diagnosisForAlert,
        ),
      );
      setModalVisible(true);
    } catch (err) {
      console.log(err);
      setModalTitle("Unable to Save Reading");
      setModalBody("Blood pressure could not be recorded. Please try again.");
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

      <AddBloodPressureForm
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
