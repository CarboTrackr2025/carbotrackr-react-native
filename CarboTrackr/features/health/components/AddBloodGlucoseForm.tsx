import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { color, gradient } from "../../../shared/constants/colors";
import { formatPhilippinesTime } from "../../../shared/utils/formatters";
import { Button } from "../../../shared/components/Button";
import { GradientTextInput } from "../../../shared/components/GradientTextInput";
import { GradientTextDisplay } from "../../../shared/components/GradientTextDisplay";

type BloodGlucoseInput = {
  level: string;
};

type Props = {
  submitting?: boolean;
  onSubmit: (values: BloodGlucoseInput) => void | Promise<void>;
  timestamp?: string | null;
};

export default function AddBloodGlucoseForm({
  submitting = false,
  onSubmit,
  timestamp,
}: Props) {
  const [level, setLevel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const l = Number(level);
    return Number.isFinite(l) && l > 0 && !submitting;
  }, [level, submitting]);

  const handleSubmit = async () => {
    setError(null);
    await onSubmit({ level });
  };

  const recordedText = timestamp ? formatPhilippinesTime(timestamp) : "—";

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Blood Glucose Level (mg/dL)</Text>
      <GradientTextInput
        value={level}
        onChangeText={(t) => setLevel(t.replace(/[^\d.]/g, ""))}
        placeholder="100"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Recorded Date and Time</Text>
      <GradientTextDisplay text={recordedText} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={submitting ? "Saving..." : "Save"}
        onPress={handleSubmit}
        disabled={!canSubmit}
        gradient={gradient.green as [string, string]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: "600",
    color: color.black,
  },
  error: {
    color: "red",
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
  },
});
