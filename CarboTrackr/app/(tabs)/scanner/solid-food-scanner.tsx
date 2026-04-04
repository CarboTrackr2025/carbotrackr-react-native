<<<<<<< Updated upstream
import { StyleSheet, Text, View } from "react-native"

export default function SolidFoodScanner() {
=======
import React, { useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import * as ImagePicker from "expo-image-picker"

import { postSolidFoodPhoto, type SolidFoodPredictionResult } from "../../../features/scanner/api/post-solid-food-photo"
import { postFoodLogFromSolidFoodScanner } from "../../../features/scanner/api/post-food"
import { useAuth } from "@clerk/clerk-expo"
import { CalorieRing } from "../../../shared/components/CalorieRing"
import { GradientTextDisplay } from "../../../shared/components/GradientTextDisplay"
import { GradientTextInput } from "../../../shared/components/GradientTextInput"
import { Dropdown } from "../../../shared/components/Dropdown"
import { Button } from "../../../shared/components/Button"
import { color, gradient } from "../../../shared/constants/colors"
import { formatPhilippinesTime } from "../../../shared/utils/formatters"

export default function SolidFoodScanner() {
    const { userId } = useAuth()
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

            const accountId = userId
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

>>>>>>> Stashed changes
    return (
        <View style={styles.container}>
            <Text>Solid Food Scanner</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
})