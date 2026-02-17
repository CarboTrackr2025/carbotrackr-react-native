import React from "react";
import { Text, View, StyleSheet, Modal, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../constants/colors";

type Props = {
    visible: boolean; // Controls whether the modal is shown
    onClose: () => void; // Function to close the modal
    message?: string;
    gradient: ['#BBF451', '#098D00'];
};

export function FailedModal({ visible, onClose, message = "Action Failed", gradient }: Props) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            {/* The Darkened Overlay */}
            <Pressable style={styles.overlay} onPress={onClose}>
                
                {/* The Modal Container (Pressable here prevents clicks inside from closing the modal) */}
                <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                    <LinearGradient
                        colors={gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.border}
                    >
                        <View style={styles.inner}>
                            <View style={[styles.fill, styles.defaultFill]} />
                            
                            <View style={styles.content}>
                                <Text style={styles.text}>{message}</Text>
                                <Ionicons 
                                    name="close-circle" 
                                    size={24} 
                                    color={color.red} 
                                />
                            </View>
                        </View>
                    </LinearGradient>
                </Pressable>

            </Pressable>
        </Modal>
    );
}

const BORDER_W = 2.5;
const RADIUS = 12;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)", // This creates the darkened background
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalContainer: {
        width: "100%",
        maxWidth: 400, // Optional: prevents modal from being too wide on tablets
    },
    border: {
        width: "100%",
        minHeight: 80, 
        borderRadius: RADIUS,
        padding: BORDER_W,
        justifyContent: "center",
        overflow: "hidden",
        // Adding a shadow for better depth on the darkened background
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    inner: {
        flex: 1,
        borderRadius: RADIUS - BORDER_W,
        justifyContent: "center",
        paddingHorizontal: 16,
        overflow: "hidden",
    },
    fill: {
        ...StyleSheet.absoluteFillObject,
    },
    defaultFill: {
        backgroundColor: color.white,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 1,
    },
    text: {
        fontSize: 16, // Bumped slightly for better readability on overlay
        fontWeight: "600",
        color: color.black,
    },
});