import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ButtonVersion2 } from "../../../shared/components/ButtonVersion2";

export default function IndexScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Scanners</Text>
            <View style={styles.outerContainer}>
                <View style={styles.stylesRow}>
                    <ButtonVersion2
                        label="Nutritional Info Scanner"
                        iconName="receipt"
                        onPress={() => router.push("/(tabs)/scanner/nutritional-info-scanner")}
                    />
                    <ButtonVersion2
                        label="Solid Food Scanner"
                        iconName="fast-food"
                        onPress={() => router.push("/(tabs)/scanner/solid-food-scanner")}
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
    outerContainer: {
        flex: 1,
        gap: 20,
        paddingHorizontal: 12,
    },
    stylesRow: {
        flexDirection: "row",
        gap: 20,
        justifyContent: "flex-start",
    },
});