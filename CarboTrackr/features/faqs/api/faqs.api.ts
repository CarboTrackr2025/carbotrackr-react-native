import { api } from "../../../shared/api";

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
    return response.data;
  } catch (error: any) {
    console.error(
      `❌ [FAQs API] Failed to fetch FAQs for topic "${topic}":`,
      error,
    );
    throw error;
  }
};
