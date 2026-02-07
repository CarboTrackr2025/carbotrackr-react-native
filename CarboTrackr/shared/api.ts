// `CarboTrackr/shared/post-blood-pressure.ts`
import axios from "axios";

const PORT = 3000;

const DEV_LAN_BASE_URL = `http://192.168.105.213:${PORT}`;
const PROD_BASE_URL = "";

export const API_BASE_URL: string = DEV_LAN_BASE_URL; // swap to PROD_BASE_URL for production

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});