import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const SESSION_KEY = "clerk_session_id";
const USER_ID_KEY = "clerk_user_id";

// ── Clerk TokenCache using SecureStore (recommended for @clerk/clerk-expo) ──
export const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignore errors
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore errors
    }
  },
};

// ── Session persistence (used after OAuth / email login) ──

export async function saveClerkSession({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, sessionId);
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  } catch {
    // Non-fatal
  }
}

export async function getClerkSession(): Promise<{
  sessionId: string | null;
  userId: string | null;
}> {
  try {
    const sessionId = await AsyncStorage.getItem(SESSION_KEY);
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    return { sessionId, userId };
  } catch {
    return { sessionId: null, userId: null };
  }
}

// ── Legacy token management (for backend tokens if needed) ──

export async function clearAllAuth(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(SESSION_KEY);
  await AsyncStorage.removeItem(USER_ID_KEY);
}

export async function clearClerkTokenCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const clerkKeys = allKeys.filter((k) => k.startsWith("clerk."));
    const keysToRemove = [
      ...clerkKeys,
      TOKEN_KEY,
      SESSION_KEY,
      USER_ID_KEY,
    ];
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch {
    // Ignore errors
  }
}
