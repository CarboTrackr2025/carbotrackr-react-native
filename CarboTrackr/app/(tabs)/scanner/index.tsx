import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ButtonVersion2 } from "../../../shared/components/ButtonVersion2";

export default function IndexScreen() {
    return (
        <SafeAreaView style={styles.container}>
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
                <Text style={styles.disclaimer}>
                    Disclaimer: The accuracy of the Nutritional Info Scanner and Solid Food Scanner may not be 100% accurate. Please verify results with reliable nutritional sources or measured it with a food laboratory services.
                </Text>
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
    disclaimer: {
        fontSize: 12,
        color: "#999999",
        textAlign: "center",
        paddingHorizontal: 12,
    },
});