import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { GradientTextInput } from "./GradientTextInput";
import { color, gradient } from "../constants/colors";

type SearchTextInputProps = {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit?: (text: string) => void;
    placeholder?: string;
    containerStyle?: StyleProp<ViewStyle>;
    editable?: boolean;
    autoFocus?: boolean;
};

export function SearchTextInput({
                                    value,
                                    onChangeText,
                                    onSubmit,
                                    placeholder = "Search food...",
                                    containerStyle,
                                    editable = true,
                                    autoFocus = false,
                                }: SearchTextInputProps) {
    return (
        <GradientTextInput
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={() => onSubmit?.(value.trim())}
            placeholder={placeholder}
            editable={editable}
            autoFocus={autoFocus}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            iconName="search"
            iconSize={20}
            iconColor={color.black}
            colors={gradient.green as [string, string]}
            containerStyle={containerStyle}
        />
    );
}