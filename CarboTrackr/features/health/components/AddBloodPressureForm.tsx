import React, {useMemo, useState} from "react"
import { StyleSheet, Text, TextInput, View} from "react-native"
import {LinearGradient} from "expo-linear-gradient"
import {color, gradient} from "../../../shared/constants/colors"
import {formatPhilippinesTime} from "../health.utils"
import {Button} from "../../../shared/components/Button"

type BloodPressureInput = {
    systolic_mmHg: number
    diastolic_mmHg: number
}

type Props = {
    submitting?: boolean
    onSubmit: (values: BloodPressureInput) => void | Promise<void>
    timestamp?: string | null
}

type GradientInputProps = {
    value: string
    onChangeText: (t: string) => void
    placeholder: string
}

function GradientInput({value, onChangeText, placeholder}: GradientInputProps) {
    return (
        <LinearGradient
            colors={gradient.green as [string, string]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.inputBorder}
        >
            <View style={styles.inputInner}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType="number-pad"
                    placeholder={placeholder}
                    style={styles.textInput}
                    placeholderTextColor="#9CA3AF"
                />
            </View>
        </LinearGradient>
    )
}

function GradientDisplay({text}: { text: string }) {
    return (
        <LinearGradient
            colors={gradient.green as [string, string]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.inputBorder}
        >
            <View style={styles.inputInner}>
                <Text style={styles.displayText}>{text}</Text>
            </View>
        </LinearGradient>
    )
}

export default function AddBloodPressureForm({submitting = false, onSubmit, timestamp}: Props) {
    const [systolic, setSystolic] = useState("")
    const [diastolic, setDiastolic] = useState("")
    const [error, setError] = useState<string | null>(null)

    const canSubmit = useMemo(() => {
        const s = Number(systolic)
        const d = Number(diastolic)
        return Number.isFinite(s) && Number.isFinite(d) && s > 0 && d > 0 && !submitting
    }, [systolic, diastolic, submitting])

    const handleSubmit = async () => {
        setError(null)
        const s = Number(systolic)
        const d = Number(diastolic)
        await onSubmit({systolic_mmHg: s, diastolic_mmHg: d})
    }

    const recordedText = timestamp ? formatPhilippinesTime(timestamp) : "—"

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Systolic</Text>
            <GradientInput
                value={systolic}
                onChangeText={(t) => setSystolic(t.replace(/[^\d]/g, ""))}
                placeholder="120"
            />

            <Text style={styles.label}>Diastolic</Text>
            <GradientInput
                value={diastolic}
                onChangeText={(t) => setDiastolic(t.replace(/[^\d]/g, ""))}
                placeholder="80"
            />

            <Text style={styles.label}>Recorded Date and Time</Text>
            <GradientDisplay text={recordedText}/>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title={submitting ? "Saving..." : "Save"} onPress={handleSubmit} disabled={!canSubmit} gradient={gradient.green as [string, string]}/>
        </View>
    )
}

const BORDER_W = 2.5
const RADIUS = 12

const styles = StyleSheet.create({
  container: {
    padding: 12,
    columnGap: 26,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: "600",
    color: color.black,
  },
  inputBorder: {
    width: "100%",
    height: 54,
    borderRadius: RADIUS,
    padding: BORDER_W,
    justifyContent: "center",
    overflow: "hidden", // keep gradient edge consistent
  },
  inputInner: {
    flex: 1,
    borderRadius: RADIUS - BORDER_W,
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden", // prevent inner from visually thinning the bottom edge
  },
  textInput: {
    flex: 1,
    paddingVertical: 0,
    color: "#111827",
    fontSize: 14,
  },
  displayText: {
    color: "#111827",
    fontSize: 14,
    opacity: 0.8,
  },
  error: {
    color: "red",
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
  },
})