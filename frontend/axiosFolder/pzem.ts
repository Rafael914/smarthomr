import axios from "axios";
import { BASE_URL } from "../utils/api";

export type PzemHistoryItem = {
  period: string;
  total_kwh: string | number;
};

export type PzemHistoryResponse = {
  hourly: PzemHistoryItem[];
  daily: PzemHistoryItem[];
  monthly: PzemHistoryItem[];
};

export const fetchPzem = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/pzem`, { timeout: 5000 });

    if (Array.isArray(res.data)) {
      return {
        readings: res.data,
        error: false,
      };
    }

    return {
      readings: [],
      error: true,
    };
  } catch (error: any) {
    console.log("PZEM Fetch Error:", error.message);
    return {
      readings: [],
      error: true,
    };
  }
};

export const fetchPzemHistory = async (): Promise<PzemHistoryResponse> => {
  const res = await axios.get(`${BASE_URL}/api/pzem/history`, {
    timeout: 5000,
  });

  return res.data;
};
