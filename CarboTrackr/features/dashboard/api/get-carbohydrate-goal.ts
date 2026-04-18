import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";

type CarbohydrateGoalApiResponse = {
  status: "success" | "error";
  message: string;
  data?: {
    account_id: string;
    date: string;
    daily_carbohydrate_goal_g: number;
    current_carbohydrates_g: number;
  };
};

export type DashboardCarbohydrateGoal = {
  dailyCarbohydrateGoalG: number;
  currentCarbohydratesG: number;
  date: string;
};

const toYMDUtc = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export async function getDashboardCarbohydrateGoal(
  accountId: string,
  date: string = toYMDUtc(new Date()),
): Promise<DashboardCarbohydrateGoal> {
  const fallback: DashboardCarbohydrateGoal = {
    dailyCarbohydrateGoalG: 0,
    currentCarbohydratesG: 0,
    date,
  };

  try {
    const url = `${API_BASE_URL}/health/${accountId}/carbohydrates/goal`;
    const res = await axios.get<CarbohydrateGoalApiResponse>(url, {
      params: { date },
    });

    const payload = res.data;

    if (!payload || payload.status !== "success" || !payload.data) {
      throw new Error(payload?.message || "Failed to fetch carbohydrate goal.");
    }

    console.log("[Dashboard API] Carbohydrate goal payload", {
      response: payload,
      accountId,
      requestDate: date,
      responseDate: payload.data.date,
      dailyCarbohydrateGoalG: payload.data.daily_carbohydrate_goal_g,
      currentCarbohydratesG: payload.data.current_carbohydrates_g,
    });

    return {
      dailyCarbohydrateGoalG: Number(
        payload.data.daily_carbohydrate_goal_g ?? 0,
      ),
      currentCarbohydratesG: Number(payload.data.current_carbohydrates_g ?? 0),
      date: payload.data.date,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseMessage = String(error.response?.data?.message ?? "");

      if (
        status === 404 &&
        /no profile found for this account/i.test(responseMessage)
      ) {
        console.warn(
          "[Dashboard API] No profile yet, using zero dashboard values",
          {
            accountId,
            requestDate: date,
            status,
            responseBody: error.response?.data,
            url: error.config?.url,
            method: error.config?.method,
          },
        );

        return fallback;
      }

      console.error("[Dashboard API] Request failed", {
        accountId,
        requestDate: date,
        url: error.config?.url,
        method: error.config?.method,
        status,
        responseBody: error.response?.data,
        message: error.message,
      });
    } else {
      console.error("[Dashboard API] Unexpected failure", {
        accountId,
        requestDate: date,
        error,
      });
    }

    throw error;
  }
}
