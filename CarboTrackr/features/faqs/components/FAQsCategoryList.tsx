import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { color, gradient } from "../../../shared/constants/colors";

interface FAQsCategoryListProps {
  categories: Array<{
    id: string;
    topic: string;
    displayName: string;
  }>;
  onSelectCategory: (category: any) => void;
  onContactPress: () => void;
}

const BORDER_W = 2.5;
const RADIUS = 12;

export default function FAQsCategoryList({
  categories,
  onSelectCategory,
  onContactPress,
}: FAQsCategoryListProps) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Frequently Asked Questions (FAQ)</Text>
        <Text style={styles.subtitle}>
          Choose the main topic of your question
        </Text>
      </View>

      <View style={styles.categoriesContainer}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={styles.categoryPressable}
            onPress={() => onSelectCategory(category)}
          >
            {({ pressed }) => (
              <LinearGradient
                colors={gradient.green as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryButtonBorder}
              >
                <View
                  style={[
                    styles.categoryButtonInner,
                    pressed
                      ? styles.categoryButtonPressed
                      : styles.categoryButtonDefault,
                  ]}
                >
                  <Text style={styles.categoryText}>{category.displayName}</Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={color.black}
                  />
                </View>
              </LinearGradient>
            )}
          </Pressable>
        ))}

        {/* Contact Section */}
        <View style={styles.divider} />
        <View style={styles.contactSection}>
          <Text style={styles.contactLabel}>
            Can't find the answer to your question?
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={onContactPress}
          >
            <Text style={styles.contactText}>Contact us</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={color.green}
            />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: color.black,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  categoriesContainer: {
    marginBottom: 40,
  },
  categoryPressable: {
    marginBottom: 12,
  },
  categoryButtonBorder: {
    borderRadius: RADIUS,
    padding: BORDER_W,
  },
  categoryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS - BORDER_W,
  },
  categoryButtonDefault: {
    backgroundColor: color.white,
  },
  categoryButtonPressed: {
    backgroundColor: color["light-green-2"],
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "500",
    color: color.black,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 20,
  },
  contactSection: {
    alignItems: "center",
  },
  contactLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.green,
    backgroundColor: color.white,
  },
  contactText: {
    fontSize: 16,
    fontWeight: "500",
    color: color.green,
    marginRight: 8,
  },
});
