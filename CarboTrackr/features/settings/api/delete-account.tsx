import axios from "axios";
import { API_BASE_URL } from "../../../shared/api";

export async function deleteAccountApi(accountId: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/auth/account/${accountId}`);
}
