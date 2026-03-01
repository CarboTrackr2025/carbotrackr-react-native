import React from "react"
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { color } from "../constants/colors"

type Props = {
    onFAQ: () => void
}

export function Header({ onFAQ }: Props) {
    return (
        <View style={styles.header}>
            <Text style={styles.headerBrand}>CarboTrackr</Text>
            <TouchableOpacity onPress={onFAQ} style={styles.faqButton}>
                <Ionicons name="help-circle-outline" size={28} color={color.black} />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 32,
        marginTop: 16,
    },
    headerBrand: {
        fontSize: 20,
        fontWeight: "700",
        color: color.green,
    },
    faqButton: {
        padding: 4,
    },
})