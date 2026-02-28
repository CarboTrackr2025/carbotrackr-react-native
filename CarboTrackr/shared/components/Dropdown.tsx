import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    FlatList,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";  
import { Ionicons } from "@expo/vector-icons";
import { color } from "../constants/colors";

type Option = {
    label: string;
    value: string | number | null;
};

type Props = {
    label?: string;
    options?: Option[];
    selectedValue?: string | number | null;
    onSelect?: (value: string | number | null) => void;
    gradient?: [string, string];
    placeholder?: string;
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function Dropdown({
    label,
    options = [],
    selectedValue = null,
    onSelect = () => {},
    gradient = ['#BBF451', '#098D00'],
    placeholder = "Select an option",
}: Props) {
    options = options || [];
    const [visible, setVisible] = useState(false);
    const toggleDropdown = useCallback(() => setVisible((v) => !v), []);

    const selectedItem = options.find((opt) => opt.value === selectedValue);

    const handleSelect = (value: string | number | null) => {
        onSelect(value);
        setVisible(false);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <Pressable onPress={() => setVisible(true)} style={styles.pressable}>
                <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.border}
                >
                    <View style={styles.inner}>
                        <View style={[styles.fill, styles.defaultFill]} />
                        <View style={styles.content}>
                            <Text style={[
                                styles.selectedText, 
                                !selectedItem && { color: "#999" }
                            ]}>
                                {selectedItem ? selectedItem.label : placeholder}
                            </Text>
                            <Ionicons 
                                name={visible ? "chevron-up" : "chevron-down"} 
                                size={20} 
                                color={color.black} 
                            />
                        </View>
                    </View>
                </LinearGradient>
            </Pressable>

            {/* Modal for Dropdown Items */}
            <Modal visible={visible} transparent animationType="fade">
                <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={[
                                { label: "None", value: null },
                                ...options,
                            ]}
                            keyExtractor={(item, index) => item.value?.toString() || index.toString()}
                            contentContainerStyle={styles.listContainer}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.optionItem}
                                    onPress={() => handleSelect(item.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        item.value === selectedValue && { color: "#000000", fontWeight: "700" }
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {item.value === selectedValue && (
                                        <Ionicons name="checkmark" size={18} color={"#000000"}/>                                    )}
                                </Pressable>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const BORDER_W = 2.5;
const RADIUS = 12;

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        color: color.black,
    },
    pressable: {
        width: "100%",
    },
    border: {
        borderRadius: RADIUS,
        padding: BORDER_W,
        height: 54,
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
    selectedText: {
        fontSize: 15,
        color: color.black,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)", // Darkened background
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        maxHeight: SCREEN_HEIGHT * 0.4,
        backgroundColor: color.white,
        borderRadius: RADIUS,
        overflow: "hidden",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    listContainer: {
        paddingVertical: 10,
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#eee",
    },
    optionText: {
        fontSize: 16,
        color: color.black,
    },
});