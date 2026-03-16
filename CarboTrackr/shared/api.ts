import axios from "axios";

const PORT = 3000;
const DEV_BASE_URL = `http://192.168.21.33:${PORT}`;

export const API_BASE_URL: string = DEV_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});