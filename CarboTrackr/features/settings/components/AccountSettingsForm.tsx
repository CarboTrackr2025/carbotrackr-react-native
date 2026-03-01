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

type Props = {
    initialValues: AccountSettingsData
}

export default function AccountSettingsForm({initialValues}: Props) {
    const [gender, setGender] = useState<string | number | null>(initialValues.gender)
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
        initialValues.date_of_birth ? new Date(initialValues.date_of_birth) : null
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

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === "android") {
            setShowDobPicker(false)
        }

        if (event.type === "set" && selectedDate && !Number.isNaN(selectedDate.getTime())) {
            setDateOfBirth(selectedDate)
        }
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
                    title="Save Changes"
                    onPress={() => router.push("/auth/login")}
                    gradient={gradient.green as [string, string]}
                />
                <Button
                    title="Change Password"
                    onPress={() => router.push("/auth/login")}
                    gradient={gradient.green as [string, string]}
                />
                <Button
                    title="Delete my Account"
                    onPress={() => router.push("/auth/login")}
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