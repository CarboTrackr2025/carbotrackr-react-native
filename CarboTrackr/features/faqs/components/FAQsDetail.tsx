import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { color } from "../../../shared/constants/colors";
import { FAQ } from "../api/faqs.api";

interface FAQsDetailProps {
  faqs: FAQ[];
  selectedCategory: string;
  onBack: () => void;
  isLoading?: boolean;
}

export default function FAQsDetail({
  faqs,
  selectedCategory,
  onBack,
  isLoading = false,
}: FAQsDetailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={color.green}
          />
        </TouchableOpacity>
        <Text style={styles.categoryTitle}>{selectedCategory}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.green} />
        </View>
      ) : faqs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No FAQs found for this category.</Text>
        </View>
      ) : (
        <View style={styles.faqsContainer}>
          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.questionButton}
                onPress={() => toggleExpand(faq.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.questionText}>{faq.question}</Text>
                <MaterialCommunityIcons
                  name={expandedId === faq.id ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={color.green}
                />
              </TouchableOpacity>

              {expandedId === faq.id && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: color.black,
    flex: 1,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  faqsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  faqItem: {
    borderRadius: 12,
    overflow: "hidden",
  },
  questionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: color.green,
    backgroundColor: "#fdf8f5",
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    color: color.black,
    flex: 1,
    flexWrap: "wrap",
    lineHeight: 22,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f0f0f0",
    backgroundColor: color.white,
  },
  answerText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
});
