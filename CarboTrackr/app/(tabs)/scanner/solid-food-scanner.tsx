import { StyleSheet, Text, View } from "react-native"

export default function SolidFoodScanner() {
    return (
        <View style={styles.container}>
            <Text>Solid Food Scanner</Text>
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