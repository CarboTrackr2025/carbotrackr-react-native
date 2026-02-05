import React, {useState} from "react";
import {Alert, View, StyleSheet} from "react-native";
import axios from "axios";
import AddBloodPressureForm from "../../features/health/components/AddBloodPressureForm";
import {API_BASE_URL} from "../../shared/api";

type BloodPressureInput = {
    systolic_mmHg: number;
    diastolic_mmHg: number;
};

type CreateBloodPressurePayload = BloodPressureInput & {
    profile_id: string;
};

// adjust field names to match your API response
type CreateBloodPressureResponse = {
    recorded_at?: string; // e.g. "2026-02-04T03:12:45.000Z"
    created_at?: string;
    timestamp?: string;
    data?: {
        recorded_at?: string;
        created_at?: string;
        timestamp?: string;
    };
};

const MOCK_PROFILE_ID = "3d6a6522-91be-4477-8973-9537e2cf5a86";

const evaluateBloodPressure = (systolic: number, diastolic: number): string => {
    // Hypertensive crisis (seek urgent care)
    if (systolic >= 180 || diastolic >= 120) {
        return (
            "Alert: Your blood pressure is very high (hypertensive crisis).\n\n" +
            "Seek urgent medical care now, especially if you have chest pain, shortness of breath, " +
            "severe headache, weakness, vision changes, or difficulty speaking."
        );
    }

    // Hypertension Stage 2
    if (systolic >= 140 || diastolic >= 90) {
        return (
            "Alert: Your blood pressure is high (hypertension stage 2).\n\n" +
            "Follow your treatment plan and contact your healthcare provider for guidance."
        );
    }

    // Hypertension Stage 1
    if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
        return (
            "Alert: Your blood pressure is high (hypertension stage 1).\n\n" +
            "Monitor your readings and discuss management options with your healthcare provider."
        );
    }

    // Elevated
    if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
        return (
            "Alert: Your blood pressure is elevated.\n\n" +
            "Consider lifestyle measures and continue monitoring. Consult your healthcare provider if concerned."
        );
    }

    // Normal
    if (systolic < 120 && diastolic < 80) {
        return "Your blood pressure is in the normal range.";
    }

    // Hypotension
    if (systolic < 90 || diastolic < 60) {
        return (
            "Alert: Your blood pressure is low.\n\n" +
            "Please rest, stay hydrated, and consult your doctor if you experience dizziness, fainting, " +
            "or other concerning symptoms."
        );
    }

    // Fallback (for uncommon combinations)
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

            const url = `${API_BASE_URL}/health/blood-pressure/create`;

            const response = await axios.post<CreateBloodPressureResponse>(url, payload);

            const ts =
                response.data?.recorded_at ??
                response.data?.created_at ??
                response.data?.timestamp ??
                response.data?.data?.recorded_at ??
                response.data?.data?.created_at ??
                response.data?.data?.timestamp ??
                null;

            setRecordedTimestamp(ts);

            Alert.alert(
                "Blood pressure recorded successfully.",
                evaluateBloodPressure(values.systolic_mmHg, values.diastolic_mmHg),
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
            <AddBloodPressureForm submitting={submitting} onSubmit={handleSubmit} timestamp={recordedTimestamp}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, padding: 12, backgroundColor: "#fff"},
});