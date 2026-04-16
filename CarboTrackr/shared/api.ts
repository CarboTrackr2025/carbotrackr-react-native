import axios from "axios";
import { Platform } from "react-native";

const DEV_BASE_URL = "https://carbotrackr-node-express.onrender.com";

// Use 10.0.2.2 for Android emulators, and localhost for iOS simulators.
// For physical devices, change this to your computer's local network IP (e.g., http://192.168.1.x:3000)
// const DEV_BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

export const API_BASE_URL: string = DEV_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});
