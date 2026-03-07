import React, { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FAQsCategoryList from "./FAQsCategoryList";
import FAQsDetail from "./FAQsDetail";
import { getFAQsByTopic, FAQ } from "../api/faqs.api";
import { color } from "../../../shared/constants/colors";

interface Category {
  id: string;
  topic: string;
  displayName: string;
}

const CATEGORIES: Category[] = [
  { id: "account", topic: "ACCOUNT", displayName: "Account" },
  { id: "health", topic: "HEALTH", displayName: "Health" },
  { id: "food_log", topic: "FOOD_LOG", displayName: "Food Log" },
  {
    id: "scanners",
    topic: "SCANNERS",
    displayName: "Food and Nutritional Label Scanner",
  },
  {
    id: "reports",
    topic: "REPORTS",
    displayName: "Calorie and Carbohydrate Reports",
  },
];

export default function FAQsScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectCategory = async (category: Category) => {
    console.log("📱 [FAQs Screen] Selected category:", category.displayName);
    setSelectedCategory(category);
    setIsLoading(true);
    setError(null);

    try {
      const faqsData = await getFAQsByTopic(category.topic);
      setFaqs(faqsData);
      console.log(
        `✅ [FAQs Screen] Loaded ${faqsData.length} FAQs for ${category.displayName}`,
      );
    } catch (err: any) {
      console.error("❌ [FAQs Screen] Error loading FAQs:", err);
      setError("Failed to load FAQs. Please try again.");
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCategories = () => {
    console.log("📱 [FAQs Screen] Going back to categories");
    setSelectedCategory(null);
    setFaqs([]);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CarboTrackr</Text>
        <MaterialCommunityIcons
          name="help-circle"
          size={28}
          color={color.green}
        />
      </View>

      {selectedCategory ? (
        <FAQsDetail
          faqs={faqs}
          selectedCategory={selectedCategory.displayName}
          onBack={handleBackToCategories}
          isLoading={isLoading}
        />
      ) : (
        <FAQsCategoryList
          categories={CATEGORIES}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: color.green,
  },
  errorContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: color.red,
  },
  errorText: {
    fontSize: 14,
    color: color.red,
  },
});
