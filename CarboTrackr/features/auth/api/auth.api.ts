import { saveClerkSession } from "../auth.utils"
import { api } from "../../../shared/api"
import type { SignInResource, SignUpResource } from "@clerk/types"

type LoginPayload = {
    email: string
    password: string
}

type LoginResult =
    | { success: true; userId: string }
    | { success: false; message: string }

type SignUpPayload = {
    email: string
    password: string
}

type SignUpResult =
    | { success: true; userId: string; email: string }
    | { success: false; message: string }

/**
 * Sign up with Clerk SDK (email + password), then persist the user in our backend DB.
 * NOTE: Email verification (OTP) is disabled on the Clerk dashboard — sign-up completes immediately.
 */
export async function signUpWithClerk(
    signUp: SignUpResource,
    setActive: any,
    payload: SignUpPayload
): Promise<SignUpResult> {
    try {
        console.log("📝 [Clerk SignUp] Starting sign-up for:", payload.email)

        const signUpAttempt = await signUp.create({
            emailAddress: payload.email,
            password: payload.password,
        })

        console.log("📝 [Clerk SignUp] Sign-up attempt status:", signUpAttempt.status)

        if (signUpAttempt.status === "complete") {
            return await _activateAndPersist(signUpAttempt, setActive, payload.email)
        }

        console.warn("⚠️ [Clerk SignUp] Unexpected status:", signUpAttempt.status)
        return {
            success: false,
            message: `Sign-up could not be completed (status: ${signUpAttempt.status}). Make sure email verification is disabled in the Clerk dashboard.`,
        }
    } catch (error: any) {
        console.error("❌ [Clerk SignUp] Error during sign-up:", error)
        console.error("   Error details:", JSON.stringify(error?.errors || error, null, 2))
        const message =
            error?.errors?.[0]?.longMessage ??
            error?.errors?.[0]?.message ??
            error?.message ??
            "Sign-up failed. Please try again."
        return { success: false, message }
    }
}

/**
 * Complete email verification after sign-up (when Clerk sends an OTP).
 */
export async function verifySignUpEmail(
    signUp: SignUpResource,
    setActive: any,
    code: string,
    email: string
): Promise<SignUpResult> {
    try {
        console.log("🔑 [Clerk SignUp] Verifying email with code:", code)

        const result = await signUp.attemptEmailAddressVerification({ code })

        console.log("🔑 [Clerk SignUp] Verification status:", result.status)

        if (result.status === "complete") {
            return await _activateAndPersist(result, setActive, email)
        }

        return { success: false, message: "Verification failed. Please check the code and try again." }
    } catch (error: any) {
        console.error("❌ [Clerk SignUp] Verification error:", error)
        const message =
            error?.errors?.[0]?.longMessage ??
            error?.errors?.[0]?.message ??
            error?.message ??
            "Email verification failed."
        return { success: false, message }
    }
}

/**
 * Activate the Clerk session and persist the user in our backend DB.
 */
async function _activateAndPersist(
    signUpAttempt: SignUpResource,
    setActive: any,
    email: string
): Promise<SignUpResult> {
    const sessionId = signUpAttempt.createdSessionId
    const userId = signUpAttempt.createdUserId

    console.log("🔍 [Clerk SignUp] createdSessionId:", sessionId)
    console.log("🔍 [Clerk SignUp] createdUserId:", userId)

    if (!sessionId || !userId) {
        return { success: false, message: "Sign-up succeeded but no session was created." }
    }

    // Activate the Clerk session
    await setActive({ session: sessionId })
    console.log("✅ [Clerk SignUp] Session activated!")

    // Save session locally
    await saveClerkSession({ sessionId, userId })
    console.log("💾 [Clerk SignUp] Session saved to AsyncStorage")

    // Persist user in our backend DB
    try {
        console.log("🌐 [Clerk SignUp] Persisting user in backend DB:", { userId, email })
        await api.post("/auth/account", { userId, email })
        console.log("✅ [Clerk SignUp] Backend account created!")
    } catch (backendErr: any) {
        const status = backendErr?.response?.status
        const isAxiosError = backendErr?.isAxiosError ?? false
        console.error("❌ [Clerk SignUp] Failed to persist backend account:")
        console.error("   isAxiosError:", isAxiosError)
        console.error("   HTTP status:", status)
        console.error("   message:", backendErr?.message)
        console.error("   code:", backendErr?.code)
        console.error("   response data:", JSON.stringify(backendErr?.response?.data))
        console.error("   baseURL:", api.defaults.baseURL)

        if (status === 409) {
            console.warn("⚠️ [Clerk SignUp] Backend account already exists (409). Continuing.")
        }
        // Non-fatal: don't block the user
    }

    return { success: true, userId, email }
}

/**
 * Login with Clerk SDK (email + password)
 * After Clerk signs in, we extract the session token and optionally sync with backend
 */
/**
 * Login with Clerk SDK (email + password)
 * After Clerk signs in, we activate the session and store it
 */
export async function loginWithClerk(
    signIn: SignInResource,
    setActive: any,
    payload: LoginPayload
): Promise<LoginResult> {
    try {
        console.log("🔐 [Clerk Login] Starting sign-in for:", payload.email)

        // Create Clerk sign-in with email and password
        const signInAttempt = await signIn.create({
            identifier: payload.email,
            password: payload.password,
        })

        console.log("🔐 [Clerk Login] Sign-in attempt status:", signInAttempt.status)
        console.log("🔍 [Clerk Login] Response keys:", Object.keys(signInAttempt))

        // If sign-in is complete, we have a session
        if (signInAttempt.status === "complete") {
            console.log("✅ [Clerk Login] Sign-in complete!")

            // The session is in the signInAttempt object itself
            // We need to call setActive to activate it
            const sessionId = signInAttempt.createdSessionId
            const userId = (signInAttempt as any).userId ?? (signInAttempt as any).user?.id

            console.log("🔍 [Clerk Login] createdSessionId:", sessionId)
            console.log("🔍 [Clerk Login] userId:", userId)

            if (sessionId) {
                // Activate the session with Clerk
                console.log("🔄 [Clerk Login] Activating session...")
                await setActive({ session: sessionId })
                console.log("✅ [Clerk Login] Session activated!")

                // Save session info locally for reference
                if (userId) {
                    await saveClerkSession({
                        sessionId: sessionId,
                        userId: userId,
                    })
                    console.log("💾 [Clerk Login] Session saved to AsyncStorage")
                }

                console.log("🎉 [Clerk Login] Login successful! Redirecting to home...")
                return { success: true, userId: userId || sessionId }
            }

            // Fallback: try to get session from different locations
            console.log("🔍 [Clerk Login] Searching for session in response object...")
            console.log("🔍 [Clerk Login] Full response:", JSON.stringify(signInAttempt, null, 2))

            return { success: false, message: "Sign-in succeeded but no session could be activated." }
        }

        // If sign-in requires additional steps (2FA, etc.)
        console.warn("⚠️ [Clerk Login] Additional verification required. Status:", signInAttempt.status)
        return {
            success: false,
            message: "Sign-in requires additional verification.",
        }
    } catch (error: any) {
        console.error("❌ [Clerk Login] Error during sign-in:", error)
        console.error("   Error details:", JSON.stringify(error?.errors || error, null, 2))
        const message =
            error?.errors?.[0]?.longMessage ??
            error?.errors?.[0]?.message ??
            error?.message ??
            "Login failed. Please check your credentials."
        return { success: false, message }
    }
}

/**
 * OAuth sign-in with Clerk (Google, Facebook, etc.)
 * Returns the OAuth flow result
 */
export type OAuthProvider = "oauth_google" | "oauth_facebook"

export type OAuthResult =
    | { success: true; userId: string }
    | { success: false; message: string }

export async function loginWithOAuth(
    signIn: SignInResource,
    provider: OAuthProvider
): Promise<OAuthResult> {
    try {
        console.log(`🔐 [OAuth] Starting ${provider} authentication`)

        // Start OAuth flow (Clerk will handle redirects)
        const signInAttempt = await signIn.authenticateWithRedirect({
            strategy: provider,
            redirectUrl: "/auth/oauth-callback", // Adjust if needed
            redirectUrlComplete: "/(tabs)",
        })

        console.log(`✅ [OAuth] ${provider} flow initiated successfully`)

        // Note: OAuth is async and completes via callback.
        // This function initiates the flow; the actual session
        // will be handled in the OAuth callback or by Clerk's useAuth hook
        return { success: true, userId: "" }
    } catch (error: any) {
        console.error(`❌ [OAuth] ${provider} error:`, error)
        console.error("   Error details:", JSON.stringify(error?.errors || error, null, 2))
        const message =
            error?.errors?.[0]?.longMessage ??
            error?.errors?.[0]?.message ??
            error?.message ??
            "OAuth sign-in failed."
        return { success: false, message }
    }
}