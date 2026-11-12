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
  selectedDay?: PzemHistoryItem;
  calendarYear?: number;
  calendarMonth?: number;
  calendarHourly?: PzemHistoryItem[];
  calendarDaily?: PzemHistoryItem[];
  calendarMonthly?: PzemHistoryItem[];
  calendarMonthTotal?: string | number;
  calendarYearTotal?: string | number;
};

export type PzemHistorySelection = { year: number; month: number };

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

export const fetchPzemHistory = async (date?: string, selection?: PzemHistorySelection): Promise<PzemHistoryResponse> => {
  const res = await axios.get(`${BASE_URL}/api/pzem/history`, {
    params: { ...(date ? { date } : {}), ...(selection || {}) },
    timeout: 5000,
  });

  return res.data;
};
