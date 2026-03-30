import React, { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import * as ImagePicker from "expo-image-picker"

import { postSolidFoodPhoto, type SolidFoodPredictionResult } from "../../../features/scanner/api/post-solid-food-photo"
import { CalorieRing } from "../../../shared/components/CalorieRing"
import { Button } from "../../../shared/components/Button"
import { color, gradient } from "../../../shared/constants/colors"

export default function SolidFoodScanner() {
    const [imageUri, setImageUri] = useState<string | null>(null)
    const [imageName, setImageName] = useState<string | null>(null)
    const [imageType, setImageType] = useState<string | null>(null)
    const [imageSize, setImageSize] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [result, setResult] = useState<SolidFoodPredictionResult | null>(null)
    const hasLaunchedRef = useRef(false)

    async function pickImage() {
        try {
            setErrorMsg(null)
            setResult(null)

            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
            console.log("[SolidFoodScanner] media permission", perm)
            if (!perm.granted) {
                setErrorMsg("Media library permission is needed to upload a photo.")
                return
            }

            const shot = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.15,
                allowsEditing: false,
            })

            if (shot.canceled) return

            const asset = shot.assets?.[0]
            console.log("[SolidFoodScanner] picked asset", asset)
            const uri = asset?.uri?.trim() ?? null
            if (!uri) {
                setErrorMsg("No image URI returned by picker.")
                return
            }

            console.log("[SolidFoodScanner] imageUri set", uri)
            setImageUri(uri)
            setImageName(asset?.fileName ?? null)
            setImageType(asset?.mimeType ?? null)
            setImageSize(asset?.fileSize ?? null)
        } catch (e: any) {
            console.log("[SolidFoodScanner] pickImage error", e)
            setErrorMsg(e?.message ?? "Failed to open image picker")
        }
    }

    async function analyze() {
        if (!imageUri) return

        try {
            setLoading(true)
            setErrorMsg(null)
            setResult(null)

            if (imageSize && imageSize > 3_000_000) {
                throw new Error("Photo is still too large for upload. Please retake closer to the food.")
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
        pickImage()
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
        await pickImage()
    }

    const carbsG = result?.prediction?.total_carbohydrates_g ?? 0
    const proteinG = result?.prediction?.total_protein_g ?? 0
    const fatG = result?.prediction?.total_fat_g ?? 0
    const calories = result?.prediction?.total_calories_kcal ?? carbsG * 4 + proteinG * 4 + fatG * 9
    const detectedItems = result?.prediction?.detected_items ?? []

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
                            <Text style={styles.modalButtonText}>Upload Image Again</Text>
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
                    servings={1}
                    size={160}
                />
            </View>

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
                title="Upload Another Image"
                onPress={retakePhoto}
                gradient={gradient.green as [string, string]}
            />

            <Text style={styles.debugTitle}>Debug Result</Text>
            <View style={styles.debugBox}>
                <Text style={styles.debugText}>
                    {result ? JSON.stringify(result.raw, null, 2) : "No result yet."}
                </Text>
            </View>
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
    debugTitle: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: "700",
        color: color.black,
    },
    debugBox: {
        backgroundColor: "#F3F4F6",
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    debugText: {
        fontFamily: "monospace",
        fontSize: 12,
        color: "#111827",
    },
})
