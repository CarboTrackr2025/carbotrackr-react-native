import {  StyleSheet, Text, View } from "react-native";
import { router} from "expo-router";
import { Button } from "../../../shared/components/Button";
import {gradient} from "../../../shared/constants/colors";
import { ToggleButton } from "../../../shared/components/ToggleButton";
import { useState } from "react";
import { CarbohydrateReportScreen } from "./carbohydrate-report";
import { CalorieReportScreen } from "./calorie-report";

export default function Index() {
    const [selected, setSelected] = useState<"option1" | "option2">("option1");
    return (
        <View style={styles.container}>
            <View style={{marginBottom: 20}}>
            {selected === "option1" ? <CalorieReportScreen /> : <CarbohydrateReportScreen />}
            </View>
            <ToggleButton
                option1="Calories"
                option2="Carbohydrates"
                selectedOption={selected}
                onToggle={setSelected}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 30,
        paddingVertical: 250,
    },
});