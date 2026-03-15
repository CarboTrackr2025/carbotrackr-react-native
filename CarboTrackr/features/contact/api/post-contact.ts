import { api } from "../../../shared/api";

export interface ContactInquiryPayload {
  subject: string;
  message: string;
  email_address: string;
}

export const submitContactInquiry = async (
  payload: ContactInquiryPayload,
): Promise<void> => {
  try {
    await api.post("/contact", payload);
  } catch (error: any) {
    throw error;
  }
};
