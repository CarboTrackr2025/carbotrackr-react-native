import React, {useMemo, useState} from "react"
import {Platform, StyleSheet, Text, View} from "react-native"
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker"
import {router} from "expo-router"
import {Button} from "../../../shared/components/Button"
import {Dropdown} from "../../../shared/components/Dropdown"
import {GradientTextDisplay} from "../../../shared/components/GradientTextDisplay"
import {GradientTextInput} from "../../../shared/components/GradientTextInput"
import {color, gradient} from "../../../shared/constants/colors"

type AccountSettingsData = {
    email: string
    gender: string | number | null
    date_of_birth: string | null
    height_cm: number | null
    weight_kg: number | null
}

type SaveAccountSettingsInput = {
    gender: "MALE" | "FEMALE" | null
    date_of_birth: string | null
    height_cm: number | null
    weight_kg: number | null
}

type Props = {
    initialValues: AccountSettingsData
    onSave: (values: SaveAccountSettingsInput) => Promise<void>
    saving: boolean
    onDeleteAccount?: () => void | Promise<void>
    deleting?: boolean
}

/** Parse an ISO/date string as LOCAL midnight to avoid UTC timezone shift. */
function parseDateLocal(value: string | null): Date | null {
    if (!value) return null
    // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.sssZ" — grab just the date part
    const datePart = value.slice(0, 10) // "YYYY-MM-DD"
    const [year, month, day] = datePart.split("-").map(Number)
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day) // local midnight
}

/** Serialize a Date as "YYYY-MM-DD" in local time (no UTC conversion). */
function toLocalDateString(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

export default function AccountSettingsForm({
                                                initialValues,
                                                onSave,
                                                saving,
                                                onDeleteAccount,
                                                deleting,
                                            }: Props) {
    const [gender, setGender] = useState<string | number | null>(initialValues.gender)
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
        parseDateLocal(initialValues.date_of_birth)
    )
    const [showDobPicker, setShowDobPicker] = useState(false)
    const [height, setHeight] = useState(
        initialValues.height_cm != null ? String(initialValues.height_cm) : ""
    )
    const [weight, setWeight] = useState(
        initialValues.weight_kg != null ? String(initialValues.weight_kg) : ""
    )

    const genderOptions = [
        {label: "Male", value: "MALE"},
        {label: "Female", value: "FEMALE"},
    ]

    const formattedDateOfBirth = useMemo(() => {
        if (!dateOfBirth || Number.isNaN(dateOfBirth.getTime())) {
            return ""
        }

        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(dateOfBirth)
    }, [dateOfBirth])

    const canSave = useMemo(() => {
        const parsedHeight = Number(height)
        const parsedWeight = Number(weight)

        return (
            (gender === "MALE" || gender === "FEMALE") &&
            !!dateOfBirth &&
            !Number.isNaN(dateOfBirth.getTime()) &&
            Number.isFinite(parsedHeight) &&
            parsedHeight > 0 &&
            Number.isFinite(parsedWeight) &&
            parsedWeight > 0 &&
            !saving
        )
    }, [gender, dateOfBirth, height, weight, saving])

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === "android") {
            setShowDobPicker(false)
        }

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
        })
    }

    return (
        <View style={styles.container}>
            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <GradientTextDisplay text={initialValues.email} />
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
                <Text style={styles.label}>Gender</Text>
                <Dropdown
                    options={genderOptions}
                    selectedValue={gender}
                    onSelect={setGender}
                />
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

            <View style={styles.buttonGroup}>
                <Button
                    title={saving ? "Saving..." : "Save Changes"}
                    onPress={handleSave}
                    disabled={!canSave}
                    gradient={gradient.green as [string, string]}
                />
                <Button
                    title="Change Password"
                    onPress={() => router.push("/auth/change-password")}
                    gradient={gradient.green as [string, string]}
                />
                <Button
                    title={deleting ? "Deleting..." : "Delete my Account"}
                    onPress={onDeleteAccount ?? (() => router.push("/auth/login"))}
                    disabled={deleting}
                    gradient={gradient.red as [string, string]}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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