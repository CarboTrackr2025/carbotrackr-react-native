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
    if (systolic < 90 || diastolic < 60) {
        return (
            "Alert: Your blood pressure is low.\n\n" +
            "Please rest, stay hydrated, and consult your doctor if you experience " +
            "dizziness, fainting, or other concerning symptoms."
        );
    }

    if (systolic <= 120 && diastolic <= 80) {
        return "Great job—you currently have a normal blood pressure level.";
    }

    if (systolic >= 120 && systolic < 130 && diastolic < 80) {
        return (
            "Alert: Your blood pressure is elevated.\n\n" +
            "- Please take your prescribed maintenance medication, and consult " +
            "your doctor if you experience common symptoms such as headaches, dizziness, " +
            "or blurred vision, or any unusual or worsening side effects.\n"
        );
    }

    return (
        "Your blood pressure does not fall within the normal or elevated ranges. " +
        "Please consult your healthcare provider for a comprehensive evaluation and " +
        "personalized advice."
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