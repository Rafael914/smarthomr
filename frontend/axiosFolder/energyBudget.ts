import axios from "axios";
import { BASE_URL } from "../utils/api";

export type EnergyBudget = {
  ratePerKwh: number;
  limits: Record<string, number>;
  costs: Record<string, number>;
  tripped: Record<string, boolean>;
};

export const fetchEnergyBudget = async (): Promise<EnergyBudget> => {
  const response = await axios.get(`${BASE_URL}/api/energy-budget`, { timeout: 5000 });
  return response.data;
};

export const saveEnergyBudget = async (
  ratePerKwh: number,
  limits: Record<string, number>,
  resetCosts: boolean,
): Promise<EnergyBudget> => {
  const response = await axios.put(`${BASE_URL}/api/energy-budget`, {
    ratePerKwh,
    limits,
    resetCosts,
  });
  return response.data;
};
