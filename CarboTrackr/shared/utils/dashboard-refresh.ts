import { DeviceEventEmitter } from "react-native";

export const DASHBOARD_REFRESH_EVENT = "carbotrackr:dashboard-refresh";

export const requestDashboardRefresh = () => {
  DeviceEventEmitter.emit(DASHBOARD_REFRESH_EVENT);
};