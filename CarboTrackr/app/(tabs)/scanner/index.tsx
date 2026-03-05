import React, { useMemo, useState } from "react"
import { Alert, Image, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native"
import * as ImagePicker from "expo-image-picker"

// ✅ import your API wrapper
import { postLabelMacrosOnly } from "../../../features/scanner/api/post-nutritional-label-photo"

export default function IndexScreen() {
    const [imageUri, setImageUri] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{
        macros_per_serving: {
            calories_kcal: number | null
            carbs_g: number | null
            protein_g: number | null
            fat_g: number | null
        }
        confidence: number
    } | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const canAnalyze = useMemo(() => !!imageUri && !loading, [imageUri, loading])

    async function takePhoto() {
        try {
            setErrorMsg(null)
            setResult(null)

            const perm = await ImagePicker.requestCameraPermissionsAsync()
            if (!perm.granted) {
                Alert.alert("Permission required", "Camera permission is needed to take a photo.")
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

            const out = await postLabelMacrosOnly({ imageUri }) // ✅ uploads multipart form-data
            setResult(out)
        } catch (e: any) {
            setErrorMsg(e?.message ?? "Failed to analyze label")
        } finally {
            setLoading(false)
        }
    }

    function reset() {
        setImageUri(null)
        setResult(null)
        setErrorMsg(null)
        setLoading(false)
    }

    return (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>Label Macros Test</Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                    onPress={takePhoto}
                    style={{
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderRadius: 10,
                        backgroundColor: "#111827",
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "600" }}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={analyze}
                    disabled={!canAnalyze}
                    style={{
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderRadius: 10,
                        backgroundColor: canAnalyze ? "#2563EB" : "#93C5FD",
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                        {loading ? "Analyzing..." : "Upload & Analyze"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={reset}
                    style={{
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderRadius: 10,
                        backgroundColor: "#E5E7EB",
                    }}
                >
                    <Text style={{ color: "#111827", fontWeight: "600" }}>Reset</Text>
                </TouchableOpacity>
            </View>

            {imageUri ? (
                <View style={{ gap: 8 }}>
                    <Text style={{ fontWeight: "600" }}>Preview</Text>
                    <Image
                        source={{ uri: imageUri }}
                        style={{ width: "100%", height: 320, borderRadius: 12, backgroundColor: "#F3F4F6" }}
                        resizeMode="cover"
                    />
                    <Text style={{ color: "#6B7280", fontSize: 12 }}>{imageUri}</Text>
                </View>
            ) : (
                <Text style={{ color: "#6B7280" }}>No photo yet. Tap “Take Photo”.</Text>
            )}

            {loading && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <ActivityIndicator />
                    <Text>Sending image to API…</Text>
                </View>
            )}

            {errorMsg && (
                <View style={{ padding: 12, borderRadius: 10, backgroundColor: "#FEE2E2" }}>
                    <Text style={{ color: "#991B1B", fontWeight: "700" }}>Error</Text>
                    <Text style={{ color: "#991B1B" }}>{errorMsg}</Text>
                </View>
            )}

            {result && (
                <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#ECFDF5", gap: 6 }}>
                    <Text style={{ fontWeight: "700", color: "#065F46" }}>Result (per serving)</Text>

                    <Text>Calories: {result.macros_per_serving.calories_kcal ?? "null"} kcal</Text>
                    <Text>Carbs: {result.macros_per_serving.carbs_g ?? "null"} g</Text>
                    <Text>Protein: {result.macros_per_serving.protein_g ?? "null"} g</Text>
                    <Text>Fat: {result.macros_per_serving.fat_g ?? "null"} g</Text>

                    <Text style={{ marginTop: 6, color: "#065F46" }}>
                        Confidence: {(result.confidence * 100).toFixed(0)}%
                    </Text>
                </View>
            )}
        </ScrollView>
    )
}
