import {  StyleSheet, Text, View } from "react-native";
import { router} from "expo-router";
import { Button } from "../../../shared/components/Button";
import {gradient} from "../../../shared/constants/colors";
import { ToggleButton } from "../../../shared/components/ToggleButton";
import { useState } from "react";
import { CarbohydrateReportScreen } from "../../../features/report/components/CarbohydrateReportScreen";
import { CalorieReportScreen } from "../../../features/report/components/CalorieReportScreen";

export default function Index() {
    const [selected, setSelected] = useState<"option1" | "option2">("option1");
    return (
        <View style={styles.container}>
            <View style={styles.screenWrapper}>
                {selected === "option1" ? <CalorieReportScreen /> : <CarbohydrateReportScreen />}
            </View>
            <View style={styles.toggleWrapper} />
                <ToggleButton
                    option1="Calories"
                    option2="Carbohydrates"
                    selectedOption={selected}
                    onToggle={setSelected}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },    
    screenWrapper: {
        flex: 1,
    },
    toggleWrapper: {
        // alignItems: "center",
        // justifyContent: "center",
        paddingHorizontal: 24,
        paddingBottom: 16,
        paddingTop: 8,
        backgroundColor: "#fff",
        // paddingVertical: 250,
    },
});