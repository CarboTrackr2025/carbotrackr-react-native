import React, { useState } from "react";
import { Alert, View, StyleSheet } from "react-native";
import AddBloodPressureForm from "../../features/health/components/AddBloodPressureForm";

import {
    BloodPressureInput,
    CreateBloodPressurePayload,
    createBloodPressure,
} from "../../features/health/api/post-blood-pressure";

const MOCK_PROFILE_ID = "e17fabf0-c9f2-4230-a091-12fcf18a3411";

const evaluateBloodPressure = (systolic: number, diastolic: number): string => {
    if (systolic >= 180 || diastolic >= 120) {
        return (
            "Alert: Your blood pressure is very high (hypertensive crisis).\n\n" +
            "Seek urgent medical care now, especially if you have chest pain, shortness of breath, " +
            "severe headache, weakness, vision changes, or difficulty speaking."
        );
    }
    if (systolic >= 140 || diastolic >= 90) {
        return (
            "Alert: Your blood pressure is high (hypertension stage 2).\n\n" +
            "Follow your treatment plan and contact your healthcare provider for guidance."
        );
    }
    if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
        return (
            "Alert: Your blood pressure is high (hypertension stage 1).\n\n" +
            "Monitor your readings and discuss management options with your healthcare provider."
        );
    }
    if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
        return (
            "Alert: Your blood pressure is elevated.\n\n" +
            "Consider lifestyle measures and continue monitoring. Consult your healthcare provider if concerned."
        );
    }
    if (systolic < 120 && diastolic < 80) {
        return "Your blood pressure is in the normal range.";
    }
    if (systolic < 90 || diastolic < 60) {
        return (
            "Alert: Your blood pressure is low.\n\n" +
            "Please rest, stay hydrated, and consult your doctor if you experience dizziness, fainting, " +
            "or other concerning symptoms."
        );
    }
    return (
        "Your blood pressure reading is outside the typical categories. " +
        "Consider rechecking and consult your healthcare provider for personalized advice."
    );
};

export default function AddBloodPressureScreen() {
    const [submitting, setSubmitting] = useState(false);
    const [recordedTimestamp, setRecordedTimestamp] = useState<string | null>(null);

    const handleSubmit = async (values: BloodPressureInput) => {
        try {
            setSubmitting(true);

            const payload: CreateBloodPressurePayload = {
                ...values,
                profile_id: MOCK_PROFILE_ID,
            };

            const { timestamp } = await createBloodPressure(payload);
            setRecordedTimestamp(timestamp);

            Alert.alert(
                "Blood pressure recorded successfully.",
                evaluateBloodPressure(values.systolic_mmHg, values.diastolic_mmHg)
            );
        } catch (err) {
            console.log(err);
            Alert.alert("Blood pressure could not be recorded. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <AddBloodPressureForm
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
