import { api } from "../../../shared/api";
import axios from "axios";

export interface FAQ {
  id: string;
  main_topic: string;
  question: string;
  answer: string;
}
export const getFAQsByTopic = async (topic: string): Promise<FAQ[]> => {
  try {
    const response = await api.get("/faqs/topic", {
      params: { topic: topic.toUpperCase() },
    });
    console.log(`✅ [FAQs API] Fetched FAQs for topic "${topic}"`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    // Some backends return 404/204 when a topic has no FAQs; treat that as empty state.
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404 || status === 204) {
        console.log(`ℹ️ [FAQs API] No FAQs found for topic "${topic}"`);
        return [];
      }
    }

    console.error(
      `❌ [FAQs API] Failed to fetch FAQs for topic "${topic}":`,
      error,
    );
    throw error;
  }
};
