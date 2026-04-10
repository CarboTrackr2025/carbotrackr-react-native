import axios from "axios";

const DEV_BASE_URL = "https://carbotrackr-node-express.onrender.com";

export const API_BASE_URL: string = DEV_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});
