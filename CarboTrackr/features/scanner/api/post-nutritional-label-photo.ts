import axios from "axios"
import { API_BASE_URL } from "../../../shared/api"

/* ---------- API Response Shapes ---------- */

export type LabelMacrosPerServing = {
    calories_kcal: number | null
    carbs_g: number | null
    protein_g: number | null
    fat_g: number | null
}

export type PostLabelMacrosOnlyResponse =
    | {
    ok: true
    macros_per_serving: LabelMacrosPerServing
    confidence: number
}
    | {
    ok?: false
    error: string
    details?: any
    raw?: any
}

/* ---------- UI Type ---------- */

export type LabelMacrosResult = {
    macros_per_serving: LabelMacrosPerServing
    confidence: number
    raw: PostLabelMacrosOnlyResponse
}

/* ---------- Expo / RN File Type ---------- */

export type RNImageFile = {
    uri: string
    name?: string
    type?: string // "image/jpeg", "image/png", etc.
}

/* ---------- Helpers ---------- */

const isNumberOrNull = (v: any): v is number | null =>
    v === null || (typeof v === "number" && Number.isFinite(v))

const toConfidence01 = (v: any): number => {
    const n = Number(v)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(1, n))
}

const normalize = (payload: any): LabelMacrosResult => {
    if (payload?.ok !== true) {
        throw new Error(String(payload?.error ?? "Failed to analyze label"))
    }

    const macros = payload?.macros_per_serving
    const confidence = toConfidence01(payload?.confidence)

    const valid =
        macros &&
        isNumberOrNull(macros.calories_kcal) &&
        isNumberOrNull(macros.carbs_g) &&
        isNumberOrNull(macros.protein_g) &&
        isNumberOrNull(macros.fat_g)

    if (!valid) {
        throw new Error("Invalid response: missing macro fields")
    }

    return {
        macros_per_serving: {
            calories_kcal: macros.calories_kcal,
            carbs_g: macros.carbs_g,
            protein_g: macros.protein_g,
            fat_g: macros.fat_g,
        },
        confidence,
        raw: payload as PostLabelMacrosOnlyResponse,
    }
}

const guessMimeFromUri = (uri: string) => {
    const u = uri.toLowerCase()
    if (u.endsWith(".png")) return "image/png"
    if (u.endsWith(".webp")) return "image/webp"
    if (u.endsWith(".heic")) return "image/heic"
    if (u.endsWith(".heif")) return "image/heif"
    return "image/jpeg"
}

const guessNameFromUri = (uri: string) => {
    const last = uri.split("/").pop()
    return last && last.includes(".") ? last : `label.${guessMimeFromUri(uri).split("/")[1]}`
}

/* ---------- API Call ---------- */

/**
 * Expo: pass an image URI from ImagePicker/Camera.
 * Backend must use multer upload.single("file") (field name "file").
 */
export async function postLabelMacrosOnly(args: {
    imageUri: string
    fieldName?: string // defaults to "file"
}) {
    const { imageUri, fieldName = "file" } = args

    const url = `${API_BASE_URL}/scanner/nutritional_label` // <- change to your real route

    const form = new FormData()

    form.append(fieldName, {
        uri: imageUri,
        name: guessNameFromUri(imageUri),
        type: guessMimeFromUri(imageUri),
    } as any)

    const res = await axios.post<PostLabelMacrosOnlyResponse>(url, form, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })

    return normalize(res.data)
}
