import axios from "axios"

export type DetectedItem = {
    source_id: string
    food_name: string
    confidence: number
}

export type PredictionResponse = {
    meal_id: string
    total_carbohydrates_g: number
    total_protein_g: number
    total_fat_g: number
    total_calories_kcal: number
    detected_items: DetectedItem[]
}

export type PredictionErrorResponse = {
    error_code?: string
    message?: string
}

export type SolidFoodPredictionResult = {
    prediction: PredictionResponse
    raw: PredictionResponse
}

const PREDICT_PATH = "/predict"

const hasHttpProtocol = (url: string) => /^https?:\/\//i.test(url)

const getErrorMessage = (status?: number, payload?: PredictionErrorResponse) => {
    const fallback = payload?.message || payload?.error_code || "Failed to analyze food photo"

    if (status === 400) return fallback || "Invalid request: missing or unreadable image."
    if (status === 403) return fallback || "Forbidden: missing or invalid API key."
    if (status === 429) return fallback || "Rate limit exceeded."
    if (status === 500) return fallback || "Internal server error during inference."

    return fallback
}

export async function postSolidFoodPhoto(args: {
    imageUri: string
    imageName?: string
    imageType?: string
    mealId?: string
}) {
    const { imageUri, imageName, imageType, mealId } = args

    const baseUrl = process.env.EXPO_PUBLIC_AWS_API_URL?.trim()
    const resolvedBaseUrl = baseUrl?.replace(/\/+$/, "")
    const resolvedUrl = `${resolvedBaseUrl}${PREDICT_PATH}`
    const apiKey = process.env.EXPO_PUBLIC_AWS_API_KEY?.trim()

    console.log("[postSolidFoodPhoto] start", {
        hasImageUri: Boolean(imageUri),
        imageUri,
        imageName: imageName ?? null,
        imageType: imageType ?? null,
        mealId: mealId ?? null,
    })
    console.log("[postSolidFoodPhoto] config", {
        baseUrl,
        resolvedUrl,
        hasApiKey: Boolean(apiKey),
    })

    if (!baseUrl) {
        throw new Error("Missing endpoint URL. Set EXPO_PUBLIC_AWS_API_URL.")
    }

    if (!hasHttpProtocol(baseUrl)) {
        throw new Error("Invalid EXPO_PUBLIC_AWS_API_URL. It must start with http:// or https://")
    }

    if (!apiKey) {
        throw new Error("Missing API key. Set EXPO_PUBLIC_AWS_API_KEY.")
    }

    const sendWithUri = async (uriToSend: string) => {
        const form = new FormData()
        const imagePart = {
            uri: uriToSend,
            name: imageName || "upload.jpg",
            type: imageType || "image/jpeg",
        }
        form.append("image", {
            ...imagePart,
        } as any)
        console.log("[postSolidFoodPhoto] form image part", imagePart)

        if (mealId) {
            form.append("meal_id", mealId)
            console.log("[postSolidFoodPhoto] appended meal_id", mealId)
        }

        return axios.post<PredictionResponse>(
            resolvedUrl,
            form,
            {
                headers: {
                    accept: "application/json",
                    "Content-Type": "multipart/form-data",
                    "X-API-Key": apiKey,
                },
                timeout: 30000,
            }
        )
    }

    try {
        console.log("[postSolidFoodPhoto] sending request")
        const res = await sendWithUri(imageUri)
        console.log("[postSolidFoodPhoto] success", {
            status: res.status,
            data: res.data,
        })

        return {
            prediction: res.data,
            raw: res.data,
        } satisfies SolidFoodPredictionResult
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status
            const payload = (error.response?.data ?? {}) as PredictionErrorResponse
            console.log("[postSolidFoodPhoto] axios error", {
                message: error.message,
                code: error.code,
                status,
                payload,
                responseHeaders: error.response?.headers,
                requestUrl: resolvedUrl,
                isLocalhost: resolvedBaseUrl?.includes("localhost") || resolvedBaseUrl?.includes("127.0.0.1"),
                imageUriPrefix: imageUri.split(":")[0],
            })

            if (!status && imageUri.startsWith("file://")) {
                const androidStylePath = imageUri.replace("file://", "")
                console.log("[postSolidFoodPhoto] retrying with android-style path", {
                    originalUri: imageUri,
                    retriedUri: androidStylePath,
                })
                try {
                    const retryRes = await sendWithUri(androidStylePath)
                    console.log("[postSolidFoodPhoto] retry success", {
                        status: retryRes.status,
                        data: retryRes.data,
                    })
                    return {
                        prediction: retryRes.data,
                        raw: retryRes.data,
                    } satisfies SolidFoodPredictionResult
                } catch (retryError) {
                    console.log("[postSolidFoodPhoto] retry failed", retryError)
                }
            }

            if (!status) {
                const localhostHint =
                    resolvedBaseUrl?.includes("localhost") || resolvedBaseUrl?.includes("127.0.0.1")
                        ? " You are using localhost; on device/emulator use your machine LAN IP or emulator host mapping (e.g. 10.0.2.2 for Android emulator)."
                        : ""
                const protocolHint = resolvedBaseUrl?.startsWith("http://")
                    ? " URL is http://. If your platform blocks cleartext traffic, switch to https://."
                    : ""
                throw new Error(`Network error reaching ${resolvedUrl}.${localhostHint}${protocolHint}`)
            }

            throw new Error(getErrorMessage(status, payload))
        }

        console.log("[postSolidFoodPhoto] unexpected error", error)
        throw new Error("Unexpected error while analyzing food photo.")
    }
}
