import { api } from "../../../shared/api";
import { saveClerkSession } from "../auth.utils";

/**
 * Converts raw Clerk error strings into friendly, human-readable messages.
 */
function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();

  // ── Identity / account ────────────────────────────────────────────
  if (lower.includes("identifier") && lower.includes("not found"))
    return "We couldn't find an account with that email. Double-check it or create a new account.";
  if (lower.includes("that identifier") || lower.includes("email address is taken") || lower.includes("already exists"))
    return "That email is already registered. Try logging in instead, or use a different email.";
  if (lower.includes("invalid identifier") || lower.includes("is invalid"))
    return "That doesn't look like a valid email address. Please check and try again.";

  // ── Password ───────────────────────────────────────────────────────
  if (lower.includes("password is incorrect") || lower.includes("invalid password"))
    return "Incorrect password. Please try again, or use 'Forgot your password?' to reset it.";
  if (lower.includes("password") && lower.includes("too short"))
    return "Your password must be at least 8 characters long.";
  if (lower.includes("password") && lower.includes("too common"))
    return "That password is too common. Please choose a more unique one.";
  if (lower.includes("password") && (lower.includes("pwned") || lower.includes("compromised")))
    return "That password has appeared in known data breaches. Please choose a different one.";

  // ── OTP / verification ────────────────────────────────────────────
  if (lower.includes("code is incorrect") || lower.includes("incorrect code"))
    return "That code doesn't match. Please check your email and try again.";
  if (lower.includes("code has expired") || lower.includes("expired"))
    return "That code has expired. Please request a new one.";
  if (lower.includes("too many attempts") || lower.includes("rate limit"))
    return "Too many attempts. Please wait a moment before trying again.";

  // ── Session / network ─────────────────────────────────────────────
  if (lower.includes("network") || lower.includes("fetch"))
    return "Couldn't connect to the server. Please check your internet connection and try again.";
  if (lower.includes("session") && lower.includes("not found"))
    return "Your session has expired. Please log in again.";

  // Fallback — return the raw message but capitalised cleanly
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResult =
  | { success: true; sessionId: string }
  | { success: false; message: string };

type SignUpPayload = {
  email: string;
  password: string;
};

type SignUpResult =
  | { success: true; userId: string; email: string }
  | { success: false; needsVerification: true; email: string }
  | { success: false; message: string };

/**
 * Sign up with Clerk SDK (email + password), then persist the user in our backend DB.
 * NOTE: Email verification (OTP) is disabled on the Clerk dashboard — sign-up completes immediately.
 */
export async function signUpWithClerk(
  signUp: any,
  setActive: any,
  payload: SignUpPayload,
): Promise<SignUpResult> {
  try {
    console.log("📝 [Clerk SignUp] Starting sign-up for:", payload.email);

    const signUpAttempt = await signUp.create({
      emailAddress: payload.email,
      password: payload.password,
    });

    console.log(
      "📝 [Clerk SignUp] Sign-up attempt status:",
      signUpAttempt.status,
    );

    if (signUpAttempt.status === "complete") {
      return await _activateAndPersist(signUpAttempt, setActive, payload.email);
    }

    // Email verification is required — trigger the OTP email and signal the screen
    if (signUpAttempt.status === "missing_requirements") {
      console.log(
        "📧 [Clerk SignUp] Email verification required, sending OTP...",
      );
      await signUpAttempt.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      console.log("✅ [Clerk SignUp] Verification email sent");
      return { success: false, needsVerification: true, email: payload.email };
    }

    console.log("⚠️ [Clerk SignUp] Unexpected status:", signUpAttempt.status);
    return {
      success: false,
      message: `Sign-up could not be completed (status: ${signUpAttempt.status}).`,
    };
  } catch (error: any) {
    console.log("❌ [Clerk SignUp] Error during sign-up:", error);
    console.log(
      "   Error details:",
      JSON.stringify(error?.errors || error, null, 2),
    );
    const message =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message ??
      "Sign-up failed. Please try again.";
    return { success: false, message };
  }
}

/**
 * Complete email verification after sign-up (when Clerk sends an OTP).
 */
export async function verifySignUpEmail(
  signUp: any,
  setActive: any,
  code: string,
  email: string,
): Promise<SignUpResult> {
  try {
    console.log("🔑 [Clerk SignUp] Verifying email with code:", code);

    const result = await signUp.attemptEmailAddressVerification({ code });

    console.log("🔑 [Clerk SignUp] Verification status:", result.status);

    if (result.status === "complete") {
      return await _activateAndPersist(result, setActive, email);
    }

    return {
      success: false,
      message: "Verification failed. Please check the code and try again.",
    };
  } catch (error: any) {
    console.log("❌ [Clerk SignUp] Verification error:", error);
    const message =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message ??
      "Email verification failed.";
    return { success: false, message };
  }
}

/**
 * Activate the Clerk session and persist the user in our backend DB.
 */
async function _activateAndPersist(
  signUpAttempt: any,
  setActive: any,
  email: string,
): Promise<SignUpResult> {
  const sessionId = signUpAttempt.createdSessionId;
  const userId = signUpAttempt.createdUserId;

  console.log("🔍 [Clerk SignUp] createdSessionId:", sessionId);
  console.log("🔍 [Clerk SignUp] createdUserId:", userId);

  if (!sessionId || !userId) {
    return {
      success: false,
      message: "Sign-up succeeded but no session was created.",
    };
  }

  // Activate the Clerk session
  await setActive({ session: sessionId });
  console.log("✅ [Clerk SignUp] Session activated!");
  await saveClerkSession({ sessionId, userId });
  console.log("💾 [Clerk SignUp] Session saved to AsyncStorage");

  // Persist user in our backend DB
  try {
    console.log("🌐 [Clerk SignUp] Persisting user in backend DB:", {
      userId,
      email,
    });
    await api.post("/auth/account", { userId, email });
    console.log("✅ [Clerk SignUp] Backend account created!");
  } catch (backendErr: any) {
    const status = backendErr?.response?.status;
    const isAxiosError = backendErr?.isAxiosError ?? false;
    console.log("❌ [Clerk SignUp] Failed to persist backend account:");
    console.log("   isAxiosError:", isAxiosError);
    console.log("   HTTP status:", status);
    console.log("   message:", backendErr?.message);
    console.log("   code:", backendErr?.code);
    console.log(
      "   response data:",
      JSON.stringify(backendErr?.response?.data),
    );
    console.log("   baseURL:", api.defaults.baseURL);

    if (status === 409) {
      console.log(
        "⚠️ [Clerk SignUp] Backend account already exists (409). Continuing.",
      );
    }
    // Non-fatal: don't block the user
  }

  return { success: true, userId, email };
}

/**
 * Login with Clerk SDK (email + password)
/**
 * Login with Clerk SDK (email + password).
 * Activates the Clerk session and returns the sessionId.
 * The caller is responsible for saving the session (with userId) once
 * the Clerk user context has updated (i.e. via useUser() in the screen).
 */
export async function loginWithClerk(
  signIn: any,
  setActive: any,
  payload: LoginPayload,
): Promise<LoginResult> {
  try {
    console.log("🔐 [Clerk Login] Starting sign-in for:", payload.email);

    const signInAttempt = await signIn.create({
      identifier: payload.email,
      password: payload.password,
    });

    console.log(
      "🔐 [Clerk Login] Sign-in attempt status:",
      signInAttempt.status,
    );

    if (signInAttempt.status === "complete") {
      console.log("✅ [Clerk Login] Sign-in complete!");

      const sessionId = signInAttempt.createdSessionId;
      console.log("🔍 [Clerk Login] createdSessionId:", sessionId);

      if (sessionId) {
        console.log("🔄 [Clerk Login] Activating session...");
        await setActive({ session: sessionId });
        console.log("✅ [Clerk Login] Session activated!");
        // userId will be available in the screen via useUser() after this resolves
        return { success: true, sessionId };
      }

      return {
        success: false,
        message: "Sign-in succeeded but no session could be activated.",
      };
    }

    console.log(
      "⚠️ [Clerk Login] Additional verification required. Status:",
      signInAttempt.status,
    );
    return {
      success: false,
      message: "Sign-in requires additional verification.",
    };
  } catch (error: any) {
    console.log("❌ [Clerk Login] Error during sign-in:", error);
    console.log(
      "   Error details:",
      JSON.stringify(error?.errors || error, null, 2),
    );
    const message =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message ??
      "Login failed. Please check your credentials.";
    return { success: false, message };
  }
}

/**
 * OAuth sign-in with Clerk (Google, Facebook, etc.)
 * Returns the OAuth flow result
 */
export type OAuthProvider = "oauth_google" | "oauth_facebook";

export type OAuthResult =
  | { success: true; userId: string }
  | { success: false; message: string };

export async function loginWithOAuth(
  signIn: any,
  provider: OAuthProvider,
): Promise<OAuthResult> {
  try {
    console.log(`🔐 [OAuth] Starting ${provider} authentication`);

    // Start OAuth flow (Clerk will handle redirects)
    const signInAttempt = await signIn.authenticateWithRedirect({
      strategy: provider,
      redirectUrl: "/auth/oauth-callback", // Adjust if needed
      redirectUrlComplete: "/(tabs)",
    });

    console.log(`✅ [OAuth] ${provider} flow initiated successfully`);

    // Note: OAuth is async and completes via callback.
    // This function initiates the flow; the actual session
    // will be handled in the OAuth callback or by Clerk's useAuth hook
    return { success: true, userId: "" };
  } catch (error: any) {
    console.log(`❌ [OAuth] ${provider} error:`, error);
    console.log(
      "   Error details:",
      JSON.stringify(error?.errors || error, null, 2),
    );
    const message =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message ??
      "OAuth sign-in failed.";
    return { success: false, message };
  }
}

// ── Change Password ──────────────────────────────────────────────────────────

type ChangePasswordResult =
  | { success: true }
  | { success: false; message: string };

/**
 * Change the current user's password using the Clerk SDK.
 * Clerk requires the current password to update to a new one.
 */
export async function changePasswordWithClerk(
  user: any,
  newPassword: string,
  currentPassword: string,
): Promise<ChangePasswordResult> {
  try {
    console.log("🔑 [Clerk ChangePassword] Updating password...");

    await user.updatePassword({
      currentPassword,
      newPassword,
    });

    console.log("✅ [Clerk ChangePassword] Password updated successfully!");
    return { success: true };
  } catch (error: any) {
    console.log("❌ [Clerk ChangePassword] Error:", error);
    console.log(
      "   Error details:",
      JSON.stringify(error?.errors || error, null, 2),
    );
    const message =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message ??
      "Failed to change password. Please try again.";
    return { success: false, message };
  }
}

// ── Forgot Password / Reset Password ────────────────────────────────────────

type RequestPasswordResetResult =
  | { success: true }
  | { success: false; message: string };

type VerifyPasswordResetOTPResult =
  | { success: true }
  | { success: false; message: string };

type ResetPasswordResult =
  | { success: true }
  | { success: false; message: string };

/**
 * Step 1 of forgot-password flow:
 * Request a password-reset email OTP from Clerk.
 */
export async function requestPasswordReset(
  signIn: any,
  email: string,
): Promise<RequestPasswordResetResult> {
  try {
    console.log(
      "🔑 [Clerk ForgotPassword] Requesting password reset for:",
      email,
    );

    await signIn.create({
      strategy: "reset_password_email_code",
      identifier: email,
    });

    console.log("✅ [Clerk ForgotPassword] Reset email sent!");
    return { success: true };
  } catch (error: any) {
    console.log("❌ [Clerk ForgotPassword] Error requesting reset:", error);
    console.log(
      "   Error details:",
      JSON.stringify(error?.errors || error, null, 2),
    );
    const message =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message ??
      "Failed to send reset email. Please try again.";
    return { success: false, message };
  }
}

/**
 * Step 2 of forgot-password flow:
 * Verify the OTP code sent to the user's email.
 */
export async function verifyPasswordResetOTP(
  signIn: any,
  code: string,
): Promise<VerifyPasswordResetOTPResult> {
  try {
    console.log("🔑 [Clerk ForgotPassword] Verifying OTP code...");

    const result = await signIn.attemptFirstFactor({
      strategy: "reset_password_email_code",
      code,
    });

    console.log(
      "🔑 [Clerk ForgotPassword] OTP verification status:",
      result.status,
    );

    if (result.status === "needs_new_password") {
      console.log(
        "✅ [Clerk ForgotPassword] OTP verified, ready to reset password!",
      );
      return { success: true };
    }

    console.log(
      "⚠️ [Clerk ForgotPassword] Unexpected status after OTP:",
      result.status,
    );
    return {
      success: false,
      message: "OTP verification failed. Please try again.",
    };
  } catch (error: any) {
    console.log("❌ [Clerk ForgotPassword] OTP verification error:", error);
    console.log(
      "   Error details:",
      JSON.stringify(error?.errors || error, null, 2),
    );
    const message =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message ??
      "Incorrect OTP. Please try again.";
    return { success: false, message };
  }
}

/**
 * Step 3 of forgot-password flow:
 * Set the new password after OTP has been verified.
 * Note: we do NOT activate the resulting session here — the screen
 * calls signOut() immediately after, so activating it is unnecessary
 * and would trigger the "already signed in" guard on the login page.
 */
export async function resetPasswordWithClerk(
  signIn: any,
  newPassword: string,
): Promise<ResetPasswordResult> {
  try {
    console.log("🔑 [Clerk ForgotPassword] Resetting password...");

    const result = await signIn.resetPassword({ password: newPassword });

    console.log("🔑 [Clerk ForgotPassword] Reset status:", result.status);

    if (result.status === "complete") {
      console.log("✅ [Clerk ForgotPassword] Password reset successfully!");
      return { success: true };
    }

    return {
      success: false,
      message: "Password reset could not be completed.",
    };
  } catch (error: any) {
    console.log("❌ [Clerk ForgotPassword] Reset error:", error);
    console.log(
      "   Error details:",
      JSON.stringify(error?.errors || error, null, 2),
    );
    const message =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message ??
      "Failed to reset password. Please try again.";
    return { success: false, message };
  }
}
