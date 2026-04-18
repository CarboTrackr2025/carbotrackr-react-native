import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@clerk/clerk-expo";
import { ButtonVersion2 } from "../../../shared/components/ButtonVersion2";
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
      <View style={styles.settingsOuterContainer}>
        <View style={styles.settingsRow}>
          <ButtonVersion2
            label="Account"
            iconName="person"
            onPress={() => router.push("/settings/account-settings")}
          />
          <ButtonVersion2
            label="Health"
            iconName="fitness"
            onPress={() => router.push("/settings/health-settings")}
          />
        </View>
        <View style={styles.settingsRow}>
          <ButtonVersion2
            label="FAQs"
            iconName="help-circle-outline"
            onPress={() => router.push("/faqs")}
          />
          <ButtonVersion2
            label="Log Out"
            iconName="log-out"
            gradientColors={gradient.red as [string, string]}
            onPress={handleLogout}
          />
        </View>
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
