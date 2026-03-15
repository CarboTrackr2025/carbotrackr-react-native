import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";
const CLERK_SESSION_KEY = "clerk_session";
const CLERK_USER_ID_KEY = "clerk_user_id";

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
export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ── Clerk session management ──
type ClerkSession = {
  sessionId: string;
  userId: string;
};

export async function saveClerkSession(session: ClerkSession): Promise<void> {
  await AsyncStorage.multiSet([
    [CLERK_SESSION_KEY, session.sessionId],
    [CLERK_USER_ID_KEY, session.userId],
  ]);
}

export async function getClerkSession(): Promise<ClerkSession | null> {
  try {
    const [[, sessionId], [, userId]] = await AsyncStorage.multiGet([
      CLERK_SESSION_KEY,
      CLERK_USER_ID_KEY,
    ]);
    if (sessionId && userId) {
      return { sessionId, userId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getClerkUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(CLERK_USER_ID_KEY);
}

export async function updateClerkUserId(userId: string): Promise<void> {
  await AsyncStorage.setItem(CLERK_USER_ID_KEY, userId);
}

export async function removeClerkSession(): Promise<void> {
  await AsyncStorage.multiRemove([CLERK_SESSION_KEY, CLERK_USER_ID_KEY]);
}

export async function clearAllAuth(): Promise<void> {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    CLERK_SESSION_KEY,
    CLERK_USER_ID_KEY,
  ]);
}

export async function clearClerkTokenCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const clerkKeys = allKeys.filter((k) => k.startsWith("clerk."));
    const keysToRemove = [
      ...clerkKeys,
      TOKEN_KEY,
      CLERK_SESSION_KEY,
      CLERK_USER_ID_KEY,
    ];
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch {
    // Ignore errors
  }
}

// ── Login check ──
export async function isLoggedIn(): Promise<boolean> {
  // Check if Clerk session exists
  const clerkSession = await getClerkSession();
  if (clerkSession) return true;

  // Fallback: check legacy token
  const token = await getToken();
  return token !== null;
}
