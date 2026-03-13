import React, { useEffect, useMemo, useRef, useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native"
import * as ImagePicker from "expo-image-picker"

import { postLabelMacrosOnly } from "../../../features/scanner/api/post-nutritional-label-photo"
import { CalorieRing } from "../../../shared/components/CalorieRing"
import { GradientTextDisplay } from "../../../shared/components/GradientTextDisplay"
import { GradientTextInput } from "../../../shared/components/GradientTextInput"
import { Dropdown } from "../../../shared/components/Dropdown"
import { color, gradient } from "../../../shared/constants/colors"
import { formatPhilippinesTime } from "../../../shared/utils/formatters"

export default function NutritionalInfoScanner() {
    const [imageUri, setImageUri] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const hasLaunchedRef = useRef(false)

    const [result, setResult] = useState<{
        macros_per_serving: {
            calories_kcal: number | null
            carbs_g: number | null
            protein_g: number | null
            fat_g: number | null
            serving_size_g: number | null
            serving_size_ml: number | null
            serving_description: string | null
        }
        confidence: number
    } | null>(null)

    const [brandName, setBrandName] = useState("")
    const [servingsText, setServingsText] = useState("1")
    const [mealType, setMealType] = useState<string | number | null>(null)

    const recordedTimestamp = useMemo(() => new Date().toISOString(), [])
    const recordedText = formatPhilippinesTime(recordedTimestamp)

    const servings = Number(servingsText) || 1

    const mealOptions = [
        { label: "Breakfast", value: "BREAKFAST" },
        { label: "Lunch", value: "LUNCH" },
        { label: "Dinner", value: "DINNER" },
        { label: "Snack", value: "SNACK" },
    ]

    async function takePhoto() {
        try {
            setErrorMsg(null)
            setResult(null)

            const perm = await ImagePicker.requestCameraPermissionsAsync()
            if (!perm.granted) {
                setErrorMsg("Camera permission is needed to take a photo.")
                return
            }

            const shot = await ImagePicker.launchCameraAsync({
                quality: 1,
                allowsEditing: false,
            })

            if (shot.canceled) return

            const uri = shot.assets?.[0]?.uri ?? null
            if (!uri) {
                setErrorMsg("No image URI returned by camera.")
                return
            }

            setImageUri(uri)
        } catch (e: any) {
            setErrorMsg(e?.message ?? "Failed to open camera")
        }
    }

    async function analyze() {
        if (!imageUri) return

        try {
            setLoading(true)
            setErrorMsg(null)
            setResult(null)

            const out = await postLabelMacrosOnly({ imageUri })
            setResult(out)
        } catch (e: any) {
            setErrorMsg(e?.message ?? "Failed to analyze label")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (hasLaunchedRef.current) return
        hasLaunchedRef.current = true
        takePhoto()
    }, [])

    useEffect(() => {
        if (!imageUri) return
        analyze()
    }, [imageUri])

    async function retakePhoto() {
        setImageUri(null)
        setResult(null)
        setErrorMsg(null)
        await takePhoto()
    }

    const carbsG = result?.macros_per_serving?.carbs_g ?? 0
    const proteinG = result?.macros_per_serving?.protein_g ?? 0
    const fatG = result?.macros_per_serving?.fat_g ?? 0
    const servingSizeG = result?.macros_per_serving?.serving_size_g ?? null
    const servingSizeMl = result?.macros_per_serving?.serving_size_ml ?? null
    const servingDesc = result?.macros_per_serving?.serving_description ?? null

    const carbsK = carbsG * 4
    const proteinK = proteinG * 4
    const fatK = fatG * 9

    const servingAmount =
        servingSizeG ?? servingSizeMl ?? 1

    const servingUnit =
        servingSizeG != null ? "g" : servingSizeMl != null ? "ml" : "serving"

    const calories =
        result?.macros_per_serving?.calories_kcal ??
        carbsK + proteinK + fatK

    const servingText =
        servingSizeG != null || servingSizeMl != null
            ? `${servingAmount} ${servingUnit}${servingDesc ? ` (${servingDesc})` : ""}`
            : "—"

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Modal visible={loading} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <ActivityIndicator />
                        <Text style={styles.modalTitle}>Analyzing photo...</Text>
                        <Text style={styles.modalBody}>Please wait</Text>
                    </View>
                </View>
            </Modal>

            <Modal visible={!!errorMsg} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Error</Text>
                        <Text style={styles.modalBody}>{errorMsg}</Text>
                        <Pressable style={styles.modalButton} onPress={retakePhoto}>
                            <Text style={styles.modalButtonText}>Open Camera Again</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <View style={styles.ringWrap}>
                <CalorieRing
                    nutrition={{
                        calories_kcal: calories,
                        carbs: { grams: carbsG, kcal: carbsK },
                        protein: { grams: proteinG, kcal: proteinK },
                        fat: { grams: fatG, kcal: fatK },
                        metric_serving_amount: servingAmount,
                        metric_serving_unit: servingUnit,
                    }}
                    servings={servings}
                    size={160}
                />
            </View>

            <Text style={styles.label}>Food Brand Name</Text>
            <GradientTextInput
                placeholder="Enter brand name"
                value={brandName}
                onChangeText={setBrandName}
            />

            <View style={styles.labelRow}>
                <Text style={styles.label}>Number of Servings</Text>
                <Text style={styles.labelMeta}>{servingText}</Text>
            </View>
            <GradientTextInput
                keyboardType="numeric"
                value={servingsText}
                onChangeText={setServingsText}
            />

            <Text style={styles.label}>Meal Type</Text>
            <Dropdown
                options={mealOptions}
                selectedValue={mealType}
                onSelect={setMealType}
            />

            <Text style={styles.label}>Recorded Date and Time</Text>
            <GradientTextDisplay text={recordedText} />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: color.white,
        gap: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: color.black,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    modalCard: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: color.white,
        borderRadius: 14,
        padding: 20,
        alignItems: "center",
        gap: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: color.black,
        textAlign: "center",
    },
    modalBody: {
        fontSize: 14,
        color: "#444",
        textAlign: "center",
    },
    modalButton: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: gradient.green[1],
    },
    modalButtonText: {
        color: "white",
        fontWeight: "600",
    },
    ringWrap: {
        marginTop: 8,
        alignItems: "center",
    },
    label: {
        marginTop: 8,
        marginBottom: 4,
        fontSize: 14,
        fontWeight: "600",
        color: color.black,
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
    },
    labelMeta: {
        fontSize: 12,
        color: "#6B7280",
    },
})
