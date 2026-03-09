import { StyleSheet, Text, View } from "react-native";
import { SettingsButton } from "../../../features/settings/components/SettingsButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@clerk/clerk-expo";
import { Button } from "../../../shared/components/Button";
import { gradient } from "../../../shared/constants/colors";
import { clearClerkTokenCache } from "../../../features/auth/auth.utils";

export default function IndexScreen() {
  const { signOut } = useAuth();

  async function handleLogout() {
    await clearClerkTokenCache();
    await signOut();
    router.replace("/auth/login");
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.settingsOuterContainer}>
        <View style={styles.settingsRow}>
          <SettingsButton
            label="Account"
            iconName="person"
            onPress={() => router.push("/settings/account-settings")}
          />
          <SettingsButton
            label="Health"
            iconName="fitness"
            onPress={() => router.push("/settings/health-settings")}
          />
        </View>
        <View style={styles.settingsRow}>
          <SettingsButton
            label="FAQs"
            iconName="help-circle-outline"
            onPress={() => router.push("/faqs")}
          />
        </View>
      </View>
      <View style={styles.logoutContainer}>
        <Button
          title="Log Out"
          gradient={gradient.red as [string, string]}
          onPress={handleLogout}
        />
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  settingsOuterContainer: {
    flex: 1,
    gap: 20,
    paddingHorizontal: 12,
  },
  settingsRow: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "flex-start",
  },
  logoutContainer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
