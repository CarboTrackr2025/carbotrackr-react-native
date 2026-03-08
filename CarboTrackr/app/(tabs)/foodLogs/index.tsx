import { StyleSheet, Text, View } from "react-native"
import {Button} from "../../../shared/components/Button";
import {router} from "expo-router";
import {gradient} from "../../../shared/constants/colors";

export default function Dashboard() {
    return (
        <View style={styles.container}>
            <Text>Dashboard</Text>
            <Button
                title="Search Food"
                onPress={() => router.push("/foodLogs/search-food")}
                gradient={gradient.green as [string, string]}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
})