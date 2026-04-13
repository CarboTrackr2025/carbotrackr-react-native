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

const toYMDLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export async function getDashboardCarbohydrateGoal(
  accountId: string,
  date: string = toYMDLocal(new Date()),
): Promise<DashboardCarbohydrateGoal> {
  const res = await axios.get<CarbohydrateGoalApiResponse>(
    `${API_BASE_URL}/health/${accountId}/carbohydrates/goal`,
    {
      params: { date },
    },
  );

  const payload = res.data;

  if (!payload || payload.status !== "success" || !payload.data) {
    throw new Error(payload?.message || "Failed to fetch carbohydrate goal.");
  }

  return {
    dailyCarbohydrateGoalG: Number(payload.data.daily_carbohydrate_goal_g ?? 0),
    currentCarbohydratesG: Number(payload.data.current_carbohydrates_g ?? 0),
    date: payload.data.date,
  };
}
