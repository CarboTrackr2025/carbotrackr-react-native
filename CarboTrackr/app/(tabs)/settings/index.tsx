import { StyleSheet, Text, View } from "react-native"
import { SettingsButton } from "../../../features/settings/components/SettingsButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { router} from "expo-router";
import {StatusBar} from "expo-status-bar";


export default function IndexScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text> Settings </Text>
            <View style={styles.settingsContainer}>
                <SettingsButton label="Account" iconName="person" onPress={() => router.push("/settings/account-settings")} />
                <SettingsButton label="Health" iconName="fitness" onPress={() => router.push("/settings/health-settings")} />
            </View>
            <StatusBar style="auto" />

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    settingsContainer: {
        flex: 1,
        flexDirection: "row",
        gap: 20,
    }
})