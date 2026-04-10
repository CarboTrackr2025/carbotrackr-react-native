import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "../../../shared/api";

export type DiagnosedWith =
  | "TYPE_2_DIABETES"
  | "PRE_DIABETES"
  | "NOT_APPLICABLE";

type RawDiagnosisPayload = {
  diagnosed_with?: unknown;
  data?: {
    diagnosed_with?: unknown;
  };
};

const normalizeDiagnosedWith = (value: unknown): DiagnosedWith | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();

  if (
    normalized === "TYPE_2_DIABETES" ||
    normalized === "PRE_DIABETES" ||
    normalized === "NOT_APPLICABLE"
  ) {
    return normalized;
  }

  return null;
};

const extractDiagnosedWith = (payload: RawDiagnosisPayload): DiagnosedWith | null => {
  return normalizeDiagnosedWith(
    payload?.diagnosed_with ?? payload?.data?.diagnosed_with,
  );
};

const CANDIDATE_ENDPOINTS = [
  (accountId: string) => `${API_BASE_URL}/health/${accountId}/diagnosis/latest`,
  (accountId: string) => `${API_BASE_URL}/health/${accountId}/diagnosis`,
];

export async function getLatestDiagnosis(accountId: string) {
  let lastError: unknown = null;

  for (const buildUrl of CANDIDATE_ENDPOINTS) {
    try {
      const res = await axios.get<RawDiagnosisPayload>(buildUrl(accountId));
      return {
        diagnosed_with: extractDiagnosedWith(res.data),
        raw: res.data,
      };
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 404) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return {
    diagnosed_with: null,
    raw: null,
  };
}

