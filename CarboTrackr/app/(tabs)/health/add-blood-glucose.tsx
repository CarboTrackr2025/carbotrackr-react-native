import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

import AddBloodGlucoseForm from "../../../features/health/components/AddBloodGlucoseForm";
import {
  BloodGlucoseInput,
  CreateBloodGlucosePayload,
  createBloodGlucose,
} from "../../../features/health/api/post-blood-glucose";

const evaluateBloodGlucose = (
  level: number,
  mealContext: "PRE" | "POST",
): string => {
  if (level >= 300) {
    return (
      "Alert: Your blood glucose is critically high (>=300 mg/dL).\n\n" +
      "Seek medical attention, especially if you have symptoms such as excessive thirst, " +
      "frequent urination, blurred vision, or fatigue."
    );
  }

  if (mealContext === "PRE") {
    if (level >= 126) {
      return (
        "Alert: Your pre-meal blood glucose is high (>=126 mg/dL).\n\n" +
        "This may indicate diabetes. Contact your healthcare provider for further evaluation."
      );
    }
    if (level >= 100) {
      return (
        "Alert: Your pre-meal blood glucose is elevated (100-125 mg/dL).\n\n" +
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
        "This may indicate diabetes. Contact your healthcare provider for further evaluation."
      );
    }
    if (level >= 140) {
      return (
        "Alert: Your post-meal blood glucose is elevated (140-199 mg/dL).\n\n" +
        "This may indicate prediabetes. Consider lifestyle changes and consult your healthcare provider."
      );
    }
    if (level >= 70) {
      return "Your post-meal blood glucose is in the normal range (70-139 mg/dL).";
    }
  }

  return (
    "Alert: Your blood glucose is low (<70 mg/dL).\n\n" +
    "Please consume a fast-acting carbohydrate and rest. Seek medical attention if symptoms persist."
  );
};

export default function AddBloodGlucoseScreen() {
  const { userId } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [recordedTimestamp, setRecordedTimestamp] = useState<string | null>(
    null,
  );

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

      const { timestamp } = await createBloodGlucose(payload);
      setRecordedTimestamp(timestamp);

      Alert.alert(
        "Blood glucose recorded successfully.",
        evaluateBloodGlucose(Number(values.level), values.meal_context),
      );
    } catch (err) {
      console.log(err);
      Alert.alert("Blood glucose could not be recorded. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AddBloodGlucoseForm
        submitting={submitting}
        onSubmit={handleSubmit}
        timestamp={recordedTimestamp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#fff" },
});
