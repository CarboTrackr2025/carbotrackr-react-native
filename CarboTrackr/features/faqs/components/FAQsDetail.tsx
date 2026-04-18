import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { color, gradient } from "../../../shared/constants/colors";
import { FAQ } from "../api/faqs.api";

interface FAQsDetailProps {
  faqs: FAQ[];
  selectedCategory: string;
  onBack: () => void;
  isLoading?: boolean;
}

const BORDER_W = 2.5;
const RADIUS = 12;

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
              <Pressable onPress={() => toggleExpand(faq.id)}>
                {({ pressed }) => (
                  <LinearGradient
                    colors={gradient.green as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.questionButtonBorder}
                  >
                    <View
                      style={[
                        styles.questionButtonInner,
                        expandedId === faq.id || pressed
                          ? styles.questionButtonActive
                          : styles.questionButtonDefault,
                      ]}
                    >
                      <Text style={styles.questionText}>{faq.question}</Text>
                      <MaterialCommunityIcons
                        name={expandedId === faq.id ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={color.green}
                      />
                    </View>
                  </LinearGradient>
                )}
              </Pressable>

              {expandedId === faq.id && (
                <LinearGradient
                  colors={gradient.green as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.answerBorder}
                >
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                </LinearGradient>
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
    borderRadius: RADIUS,
    overflow: "hidden",
  },
  questionButtonBorder: {
    borderRadius: RADIUS,
    padding: BORDER_W,
  },
  questionButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: RADIUS - BORDER_W,
  },
  questionButtonDefault: {
    backgroundColor: color.white,
  },
  questionButtonActive: {
    backgroundColor: color["light-green-2"],
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    color: color.black,
    flex: 1,
    flexWrap: "wrap",
    lineHeight: 22,
  },
  answerBorder: {
    marginTop: 8,
    borderRadius: RADIUS,
    padding: BORDER_W,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: RADIUS - BORDER_W,
    backgroundColor: color.white,
  },
  answerText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
});
