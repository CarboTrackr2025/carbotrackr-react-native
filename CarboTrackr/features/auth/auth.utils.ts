import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";

// ── Clerk TokenCache for AsyncStorage (required by ClerkProvider) ──
export const tokenCache = {
  async getToken(key: string) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Ignore errors
    }
  },
};

// ── Legacy token management (for backend tokens if needed) ──

export async function clearAllAuth(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function clearClerkTokenCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const clerkKeys = allKeys.filter((k) => k.startsWith("clerk."));
    const keysToRemove = [
      ...clerkKeys,
      TOKEN_KEY,
    ];
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch {
    // Ignore errors
  }
}
