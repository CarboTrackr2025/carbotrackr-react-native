import {  StyleSheet, Text, View } from "react-native";
import { router} from "expo-router";
import { Button } from "../../shared/components/Button";
import {gradient} from "../../shared/constants/colors";

export default function Index() {
    return (
        <View style={styles.container}>
            <Text>Indext</Text>
            <Button
                title="Go to Calorie Report Screen"
                onPress={() => router.push("/report/calorie-report")}
                gradient={gradient.green as [string, string]}
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
    },
});