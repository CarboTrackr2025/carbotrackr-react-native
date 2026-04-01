import React, { useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import * as ImagePicker from "expo-image-picker"

import { postSolidFoodPhoto, type SolidFoodPredictionResult } from "../../../features/scanner/api/post-solid-food-photo"
import { postFoodLogFromSolidFoodScanner } from "../../../features/scanner/api/post-food"
import { getClerkUserId } from "../../../features/auth/auth.utils"
import { CalorieRing } from "../../../shared/components/CalorieRing"
import { GradientTextDisplay } from "../../../shared/components/GradientTextDisplay"
import { GradientTextInput } from "../../../shared/components/GradientTextInput"
import { Dropdown } from "../../../shared/components/Dropdown"
import { Button } from "../../../shared/components/Button"
import { color, gradient } from "../../../shared/constants/colors"
import { formatPhilippinesTime } from "../../../shared/utils/formatters"

export default function SolidFoodScanner() {
    const [imageUri, setImageUri] = useState<string | null>(null)
    const [imageName, setImageName] = useState<string | null>(null)
    const [imageType, setImageType] = useState<string | null>(null)
    const [imageSize, setImageSize] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [result, setResult] = useState<SolidFoodPredictionResult | null>(null)
    const hasLaunchedRef = useRef(false)
    const [brandName, setBrandName] = useState("")
    const [servingsText, setServingsText] = useState("1")
    const [mealType, setMealType] = useState<string | number | null>(null)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [savedTimestamp, setSavedTimestamp] = useState<string | null>(null)

    async function takePhoto() {
        try {
            setErrorMsg(null)
            setSaveError(null)
            setResult(null)

            const perm = await ImagePicker.requestCameraPermissionsAsync()
            console.log("[SolidFoodScanner] camera permission", perm)
            if (!perm.granted) {
                setErrorMsg("Camera permission is needed to take a photo.")
                return
            }

            const shot = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.3,
                allowsEditing: false,
            })

            if (shot.canceled) return

            const asset = shot.assets?.[0]
            console.log("[SolidFoodScanner] picked asset", asset)
            const uri = asset?.uri?.trim() ?? null
            if (!uri) {
                setErrorMsg("No image URI returned by camera.")
                return
            }

            console.log("[SolidFoodScanner] imageUri set", uri)
            setImageUri(uri)
            setImageName(asset?.fileName ?? null)
            setImageType(asset?.mimeType ?? null)
            setImageSize(asset?.fileSize ?? null)
        } catch (e: any) {
            console.log("[SolidFoodScanner] takePhoto error", e)
            setErrorMsg(e?.message ?? "Failed to open camera")
        }
    }

    async function analyze() {
        if (!imageUri) return

        try {
            setLoading(true)
            setErrorMsg(null)
            setResult(null)

            if (imageSize && imageSize >= 10_000_000) {
                throw new Error("Photo is 10MB or larger. Please retake so we can compress below 10MB before upload.")
            }

            const payload = {
                imageUri: imageUri.trim(),
                imageName: imageName ?? undefined,
                imageType: imageType ?? undefined,
            }
            console.log("[SolidFoodScanner] analyze payload", payload)
            const out = await postSolidFoodPhoto(payload)
            console.log("[SolidFoodScanner] analyze success", out)
            setResult(out)
            if (!brandName.trim()) {
                const firstDetected = out?.prediction?.detected_items?.[0]?.food_name ?? ""
                if (firstDetected) setBrandName(firstDetected)
            }
        } catch (e: any) {
            console.log("[SolidFoodScanner] analyze error", e)
            setErrorMsg(e?.message ?? "Failed to analyze solid food photo")
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
        setImageName(null)
        setImageType(null)
        setImageSize(null)
        setResult(null)
        setErrorMsg(null)
        setSaveError(null)
        await takePhoto()
    }

    const carbsG = result?.prediction?.total_carbohydrates_g ?? 0
    const proteinG = result?.prediction?.total_protein_g ?? 0
    const fatG = result?.prediction?.total_fat_g ?? 0
    const calories = result?.prediction?.total_calories_kcal ?? carbsG * 4 + proteinG * 4 + fatG * 9
    const detectedItems = result?.prediction?.detected_items ?? []
    const servings = Number(servingsText) || 1
    const mealOptions = [
        { label: "Breakfast", value: "BREAKFAST" },
        { label: "Lunch", value: "LUNCH" },
        { label: "Dinner", value: "DINNER" },
        { label: "Snack", value: "SNACK" },
    ]
    const recordedText = useMemo(
        () => (savedTimestamp ? formatPhilippinesTime(savedTimestamp) : "-"),
        [savedTimestamp]
    )
    const canSave = !!result && !!brandName.trim() && !!mealType && servings > 0 && !saving

    const extractSavedTimestamp = (foodLog: any): string | null =>
        foodLog?.recorded_at ?? foodLog?.updated_at ?? foodLog?.created_at ?? null

    async function handleSave() {
        try {
            setSaving(true)
            setSaveError(null)

            if (!result) throw new Error("Analyze a photo first")
            if (!brandName.trim()) throw new Error("Food brand name is required")
            if (!mealType) throw new Error("Please select a meal type")
            if (servings <= 0) throw new Error("Number of servings must be greater than 0")

            const mealId = String(result?.prediction?.meal_id ?? "").trim()
            if (!mealId) throw new Error("Missing meal_id from prediction response")

            const accountId = await getClerkUserId()
            if (!accountId) throw new Error("User ID not found")

            const saveRes = await postFoodLogFromSolidFoodScanner({
                account_id: accountId,
                food_name: brandName.trim(),
                meal_type: String(mealType) as any,
                meal_id: mealId,
                number_of_servings: servings,
                calories_kcal: calories,
                carbohydrates_g: carbsG,
                protein_g: proteinG,
                fat_g: fatG,
                detected_items: detectedItems,
            })

            const ts = extractSavedTimestamp(saveRes?.food_log)
            if (ts) setSavedTimestamp(ts)
        } catch (e: any) {
            setSaveError(e?.message ?? "Failed to save food log")
        } finally {
            setSaving(false)
        }
    }

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
                        carbs: { grams: carbsG, kcal: carbsG * 4 },
                        protein: { grams: proteinG, kcal: proteinG * 4 },
                        fat: { grams: fatG, kcal: fatG * 9 },
                        metric_serving_amount: 1,
                        metric_serving_unit: "serving",
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
                <Text style={styles.labelMeta}>1 serving</Text>
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

            <Button
                title={saving ? "Saving..." : "Save"}
                onPress={handleSave}
                gradient={gradient.green as [string, string]}
                disabled={!canSave}
            />

            {!!saveError && <Text style={styles.saveError}>{saveError}</Text>}

            <Text style={styles.sectionTitle}>Detected Ingredients</Text>
            {detectedItems.length === 0 ? (
                <Text style={styles.emptyText}>No ingredients detected.</Text>
            ) : (
                detectedItems.map((item) => (
                    <View key={item.source_id} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.food_name}</Text>
                        <Text style={styles.itemConfidence}>{(item.confidence * 100).toFixed(1)}%</Text>
                    </View>
                ))
            )}

            <Button
                title="Retake Photo"
                onPress={retakePhoto}
                gradient={gradient.green as [string, string]}
            />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: color.white,
        gap: 10,
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
    sectionTitle: {
        marginTop: 8,
        marginBottom: 4,
        fontSize: 14,
        fontWeight: "600",
        color: color.black,
    },
    emptyText: {
        fontSize: 13,
        color: "#6B7280",
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    itemName: {
        fontSize: 14,
        color: color.black,
    },
    itemConfidence: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "600",
    },
    saveError: {
        marginTop: 8,
        color: "#B91C1C",
        fontSize: 12,
    },
})
