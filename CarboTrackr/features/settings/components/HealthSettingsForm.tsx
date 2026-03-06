import React, { useMemo, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { Button } from "../../../shared/components/Button"
import { Dropdown } from "../../../shared/components/Dropdown"
import { GradientTextInput } from "../../../shared/components/GradientTextInput"
import { color, gradient } from "../../../shared/constants/colors"
import type { HealthSettingsData as ApiHealthSettingsData } from "../api/get-health-settings"

type DiagnosedWith = NonNullable<ApiHealthSettingsData["diagnosed_with"]>

export type HealthSettingsData = ApiHealthSettingsData

export type SaveHealthSettingsInput = {
    daily_calorie_goal_kcal: number
    daily_carbohydrate_goal_g: number
    reminder_frequency: number
    diagnosed_with: DiagnosedWith
}

type Props = {
    initialValues: HealthSettingsData
    onSave: (values: SaveHealthSettingsInput) => Promise<void>
    saving: boolean
}

export default function HealthSettingsForm({
                                               initialValues,
                                               onSave,
                                               saving,
                                           }: Props) {
    const [dailyCalorieGoal, setDailyCalorieGoal] = useState(
        initialValues.daily_calorie_goal_kcal != null
            ? String(initialValues.daily_calorie_goal_kcal)
            : ""
    )

    const [dailyCarbohydrateGoal, setDailyCarbohydrateGoal] = useState(
        initialValues.daily_carbohydrate_goal_g != null
            ? String(initialValues.daily_carbohydrate_goal_g)
            : ""
    )

    const [reminderFrequency, setReminderFrequency] = useState(
        initialValues.reminder_frequency != null
            ? String(initialValues.reminder_frequency)
            : ""
    )

    const [diagnosedWith, setDiagnosedWith] = useState<DiagnosedWith | null>(
        initialValues.diagnosed_with ?? null
    )

    const diagnosedOptions = [
        { label: "Type 2 Diabetes", value: "TYPE_2_DIABETES" },
        { label: "Pre-Diabetes", value: "PRE_DIABETES" },
        { label: "Not Applicable", value: "NOT_APPLICABLE" },
    ]

    const canSave = useMemo(() => {
        const kcal = Number(dailyCalorieGoal)
        const carbs = Number(dailyCarbohydrateGoal)
        const reminders = Number(reminderFrequency)

        return (
            Number.isFinite(kcal) &&
            kcal > 0 &&
            Number.isFinite(carbs) &&
            carbs > 0 &&
            Number.isInteger(reminders) &&
            reminders >= 0 &&
            !!diagnosedWith &&
            !saving
        )
    }, [
        dailyCalorieGoal,
        dailyCarbohydrateGoal,
        reminderFrequency,
        diagnosedWith,
        saving,
    ])

    const handleSave = async () => {
        if (!canSave || !diagnosedWith) return

        await onSave({
            daily_calorie_goal_kcal: Number(dailyCalorieGoal),
            daily_carbohydrate_goal_g: Number(dailyCarbohydrateGoal),
            reminder_frequency: Number(reminderFrequency),
            diagnosed_with: diagnosedWith,
        })
    }

    return (
        <View style={styles.container}>
            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Daily Calorie Goal (kcal)</Text>
                <GradientTextInput
                    value={dailyCalorieGoal}
                    onChangeText={(text) => setDailyCalorieGoal(text.replace(/[^\d.]/g, ""))}
                    placeholder="1243"
                    keyboardType="numeric"
                    iconName="pencil"
                />
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Daily Carbohydrate Goal (g)</Text>
                <GradientTextInput
                    value={dailyCarbohydrateGoal}
                    onChangeText={(text) => setDailyCarbohydrateGoal(text.replace(/[^\d.]/g, ""))}
                    placeholder="20.3"
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
                    title={saving ? "Saving..." : "Save Changes"}
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
        marginTop: 20,
    },
})