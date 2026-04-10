import React, { useMemo, useState } from "react"
import { Platform, StyleSheet, Text, View } from "react-native"
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker"
import { Button } from "../../../shared/components/Button"
import { Dropdown } from "../../../shared/components/Dropdown"
import { GradientTextInput } from "../../../shared/components/GradientTextInput"
import { color, gradient } from "../../../shared/constants/colors"
import type { HealthSettingsData as ApiHealthSettingsData } from "../../settings/api/get-health-settings"

type DiagnosedWith = NonNullable<ApiHealthSettingsData["diagnosed_with"]>

/** Serialize a Date as "YYYY-MM-DD" in local time (no UTC conversion). */
function toLocalDateString(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

export type SetupProfileInput = {
    gender: "MALE" | "FEMALE" | null
    date_of_birth: string | null
    height_cm: number | null
    weight_kg: number | null
    reminder_frequency: number | null
    diagnosed_with: DiagnosedWith | null
}

type Props = {
    onSave: (values: SetupProfileInput) => Promise<void>
    saving: boolean
    error?: string | null
}

export default function SetupProfileForm({ onSave, saving, error }: Props) {
    const [gender, setGender] = useState<string | number | null>(null)
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)
    const [showDobPicker, setShowDobPicker] = useState(false)
    const [height, setHeight] = useState("")
    const [weight, setWeight] = useState("")
    const [reminderFrequency, setReminderFrequency] = useState("")
    const [diagnosedWith, setDiagnosedWith] = useState<DiagnosedWith | null>(null)

    const genderOptions = [
        { label: "Male", value: "MALE" },
        { label: "Female", value: "FEMALE" },
    ]

    const diagnosedOptions = [
        { label: "Type 2 Diabetes", value: "TYPE_2_DIABETES" },
        { label: "Pre-Diabetes", value: "PRE_DIABETES" },
        { label: "Not Applicable", value: "NOT_APPLICABLE" },
    ]

    const formattedDateOfBirth = useMemo(() => {
        if (!dateOfBirth || Number.isNaN(dateOfBirth.getTime())) return ""
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(dateOfBirth)
    }, [dateOfBirth])

    const canSave = useMemo(() => {
        const parsedHeight = Number(height)
        const parsedWeight = Number(weight)
        const reminders = Number(reminderFrequency)
        return (
            (gender === "MALE" || gender === "FEMALE") &&
            !!dateOfBirth &&
            !Number.isNaN(dateOfBirth.getTime()) &&
            Number.isFinite(parsedHeight) &&
            parsedHeight > 0 &&
            Number.isFinite(parsedWeight) &&
            parsedWeight > 0 &&
            Number.isInteger(reminders) &&
            reminders >= 0 &&
            !!diagnosedWith &&
            !saving
        )
    }, [gender, dateOfBirth, height, weight, reminderFrequency, diagnosedWith, saving])

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === "android") setShowDobPicker(false)
        if (event.type === "set" && selectedDate && !Number.isNaN(selectedDate.getTime())) {
            setDateOfBirth(selectedDate)
        }
    }

    const handleSave = async () => {
        if (!canSave || !dateOfBirth) return
        await onSave({
            gender: gender === "MALE" || gender === "FEMALE" ? gender : null,
            date_of_birth: toLocalDateString(dateOfBirth),
            height_cm: Number(height),
            weight_kg: Number(weight),
            reminder_frequency: Number(reminderFrequency),
            diagnosed_with: diagnosedWith,
        })
    }

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Welcome! Let's set up your profile</Text>
            <Text style={styles.subheading}>
                Tell us a bit about yourself to personalise your experience.
            </Text>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Gender</Text>
                <Dropdown
                    options={genderOptions}
                    selectedValue={gender}
                    onSelect={setGender}
                />
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <GradientTextInput
                    value={formattedDateOfBirth}
                    placeholder="Select date of birth"
                    iconName="calendar"
                    showSoftInputOnFocus={false}
                    caretHidden
                    onFocus={() => setShowDobPicker(true)}
                />
                {showDobPicker && (
                    <DateTimePicker
                        value={dateOfBirth ?? new Date(1997, 9, 10)}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        maximumDate={new Date()}
                        onChange={handleDateChange}
                    />
                )}
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Height (in cm)</Text>
                <GradientTextInput
                    value={height}
                    onChangeText={(text) => setHeight(text.replace(/[^\d.]/g, ""))}
                    placeholder="160"
                    keyboardType="numeric"
                    iconName="pencil"
                />
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Weight (in kg)</Text>
                <GradientTextInput
                    value={weight}
                    onChangeText={(text) => setWeight(text.replace(/[^\d.]/g, ""))}
                    placeholder="55"
                    keyboardType="numeric"
                    iconName="pencil"
                />
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Reminder Frequency (per day)</Text>
                <GradientTextInput
                    value={reminderFrequency}
                    onChangeText={(text) => setReminderFrequency(text.replace(/[^\d]/g, ""))}
                    placeholder="0"
                    keyboardType="number-pad"
                    iconName="pencil"
                />
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Diagnosed With</Text>
                <Dropdown
                    options={diagnosedOptions}
                    selectedValue={diagnosedWith}
                    onSelect={(value) => setDiagnosedWith(value as DiagnosedWith)}
                    placeholder="Select diagnosis"
                />
            </View>

            <View style={styles.buttonGroup}>
                <Button
                    title={saving ? "Saving..." : "Complete Setup"}
                    onPress={handleSave}
                    disabled={!canSave}
                    gradient={gradient.green as [string, string]}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heading: {
        fontSize: 22,
        fontWeight: "800",
        color: color.black,
        marginBottom: 6,
    },
    subheading: {
        fontSize: 14,
        color: "#555",
        marginBottom: 20,
    },
    errorText: {
        color: color.red,
        marginBottom: 12,
        fontSize: 14,
    },
    fieldGroup: {
        marginBottom: 6,
    },
    label: {
        fontSize: 16,
        fontWeight: "700",
        color: color.black,
        marginBottom: 6,
    },
    buttonGroup: {
        flex: 1,
        flexDirection: "column",
        gap: 20,
        marginTop: 20,
    },
})
