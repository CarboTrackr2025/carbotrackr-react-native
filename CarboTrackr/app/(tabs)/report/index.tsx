import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ToggleButton } from "../../../shared/components/ToggleButton";
import { useState } from "react";
import { CarbohydrateReportScreen } from "../../../features/report/components/CarbohydrateReportScreen";
import { CalorieReportScreen } from "../../../features/report/components/CalorieReportScreen";

export default function Index() {
    const [selected, setSelected] = useState<"option1" | "option2">("option1");
    return (
        <SafeAreaView style={styles.safe}>
            {/* ── REPORT CONTENT ── */}
            <View style={styles.content}>
                {selected === "option1" ? <CalorieReportScreen /> : <CarbohydrateReportScreen />}
            </View>

            {/* ── TAB TOGGLE ── */}
            <View style={styles.toggleWrapper}>
                <ToggleButton
                    option1="Calories"
                    option2="Carbohydrates"
                    selectedOption={selected}
                    onToggle={setSelected}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#fff",
    },
    toggleWrapper: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        backgroundColor: "#fff",
    },
    content: {
        flex: 1,
    },
});