import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import AccountSettingsForm from "../../../features/settings/components/AccountSettingsForm";
import { getAccountSettings } from "../../../features/settings/api/get-account-settings";
import { putAccountSettings } from "../../../features/settings/api/put-account-settings";
import { deleteAccountApi } from "../../../features/settings/api/delete-account";
import {
  clearClerkTokenCache,
  clearAllAuth,
} from "../../../features/auth/auth.utils";
type AccountSettingsState = {
  email: string;
  gender: string | number | null;
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
};

const EMPTY_SETTINGS: AccountSettingsState = {
  email: "",
  gender: null,
  date_of_birth: null,
  height_cm: null,
  weight_kg: null,
};

type SaveAccountSettingsInput = {
  gender: "MALE" | "FEMALE" | null;
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
};

export default function AccountSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialValues, setInitialValues] =
    useState<AccountSettingsState>(EMPTY_SETTINGS);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const { user, isLoaded } = useUser();

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);

      const accountId = user?.id;
      if (!accountId) {
        throw new Error("Account ID not found");
      }

      // 1. Soft delete on backend (Neon DB)
      await deleteAccountApi(accountId);

      // 2. Delete user from Clerk
      await user?.delete();

      // 3. Clear local auth state
      await clearClerkTokenCache();
      await clearAllAuth();

      // 4. Navigate to login
      router.replace("/auth/login");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (values: SaveAccountSettingsInput) => {
    try {
      setSaving(true);

      const accountIdFromClerk = user?.id;
      if (!accountIdFromClerk) {
        throw new Error("User ID from Clerk Auth API not found");
      }

      await putAccountSettings({
        account_id: accountIdFromClerk,
        gender: values.gender,
        date_of_birth: values.date_of_birth,
        height_cm: values.height_cm,
        weight_kg: values.weight_kg,
      });

      Alert.alert("Success", "Account settings updated.");
      setReloadKey((current) => current + 1);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to update account settings.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        if (!isLoaded) return;
        
        const accountIdFromClerk = user?.id;
        if (!accountIdFromClerk) {
          // If loaded but no user, just stop loading
          setLoading(false);
          return;
        }

        setLoading(true);
        const { data } = await getAccountSettings(accountIdFromClerk);

        if (!mounted) return;
        setInitialValues(data);
      } catch (err) {
        console.log(err);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [user?.id, isLoaded]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AccountSettingsForm
        initialValues={initialValues}
        onSave={handleSave}
        saving={saving}
        onDeleteAccount={handleDeleteAccount}
        deleting={deleting}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
