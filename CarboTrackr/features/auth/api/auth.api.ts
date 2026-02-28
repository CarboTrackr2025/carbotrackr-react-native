import { saveToken } from "../auth.utils"

type LoginPayload = {
    email: string
    password: string
}

type LoginResult =
    | { success: true }
    | { success: false; message: string }

export async function login(payload: LoginPayload): Promise<LoginResult> {

    // ── MOCK (remove this block when backend is ready) ──────────────
    const MOCK_EMAIL = "test@carbotrackr.com"
    const MOCK_PASSWORD = "password123"

    if (payload.email === MOCK_EMAIL && payload.password === MOCK_PASSWORD) {
        await saveToken("mock-token-abc123")
        return { success: true }
    } else {
        return { success: false, message: "Invalid email or password." }
    }
    // ── END MOCK ─────────────────────────────────────────────────────

    // ── REAL (uncomment this when backend is ready) ──────────────────
    // try {
    //     const response = await api.post("/auth/login", payload)
    //     await saveToken(response.data.token)
    //     return { success: true }
    // } catch (error: any) {
    //     const message = error?.response?.data?.message ?? "Login failed."
    //     return { success: false, message }
    // }
    // ── END REAL ─────────────────────────────────────────────────────
}