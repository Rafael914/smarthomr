import { sql } from "../config/db.js";
import { forceRelayOff } from "./relayController.js";

const relayKeys = ["relay1", "relay2", "relay3", "relay4", "relay5"];

let budget = {
  ratePerKwh: 0,
  limits: Object.fromEntries(relayKeys.map((key) => [key, 0])),
  costs: Object.fromEntries(relayKeys.map((key) => [key, 0])),
  lastEnergy: Object.fromEntries(relayKeys.map((key) => [key, 0])),
  tripped: Object.fromEntries(relayKeys.map((key) => [key, false])),
};

const numericValue = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

export const initEnergyBudgetTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS energy_budget (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      rate_per_kwh NUMERIC NOT NULL DEFAULT 0,
      limits JSONB NOT NULL DEFAULT '{}'::jsonb,
      costs JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_energy JSONB NOT NULL DEFAULT '{}'::jsonb,
      tripped JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const rows = await sql`SELECT * FROM energy_budget WHERE id = 1`;
  if (rows.length === 0) {
    await sql`
      INSERT INTO energy_budget (id, rate_per_kwh, limits, costs, last_energy, tripped)
      VALUES (
        1,
        0,
        ${JSON.stringify(budget.limits)}::jsonb,
        ${JSON.stringify(budget.costs)}::jsonb,
        ${JSON.stringify(budget.lastEnergy)}::jsonb,
        ${JSON.stringify(budget.tripped)}::jsonb
      )
    `;
  } else {
    const row = rows[0];
    budget = {
      ratePerKwh: numericValue(row.rate_per_kwh),
      limits: { ...budget.limits, ...(row.limits || {}) },
      costs: { ...budget.costs, ...(row.costs || {}) },
      lastEnergy: { ...budget.lastEnergy, ...(row.last_energy || {}) },
      tripped: { ...budget.tripped, ...(row.tripped || {}) },
    };
  }

  const latestReadings = await sql`
    SELECT DISTINCT ON (outlet_id) outlet_id, energy_kwh
    FROM readings
    ORDER BY outlet_id, recorded_at DESC
  `;
  const hasUsageBaseline = Object.values(budget.lastEnergy).some((energy) => numericValue(energy) > 0);
  if (!hasUsageBaseline && Object.values(budget.costs).every((cost) => numericValue(cost) === 0)) {
    latestReadings.forEach((reading) => {
      const key = `relay${reading.outlet_id}`;
      if (relayKeys.includes(key)) budget.lastEnergy[key] = numericValue(reading.energy_kwh);
    });
    await persistBudget();
  }
};

const persistBudget = async () => {
  await sql`
    UPDATE energy_budget
    SET
      rate_per_kwh = ${budget.ratePerKwh},
      limits = ${JSON.stringify(budget.limits)}::jsonb,
      costs = ${JSON.stringify(budget.costs)}::jsonb,
      last_energy = ${JSON.stringify(budget.lastEnergy)}::jsonb,
      tripped = ${JSON.stringify(budget.tripped)}::jsonb,
      updated_at = NOW()
    WHERE id = 1
  `;
};

export const getEnergyBudget = (req, res) => {
  return res.json(budget);
};

export const updateEnergyBudget = async (req, res) => {
  const ratePerKwh = Number(req.body?.ratePerKwh);
  if (!Number.isFinite(ratePerKwh) || ratePerKwh < 0) {
    return res.status(400).json({ message: "ratePerKwh must be a non-negative number." });
  }

  const requestedLimits = req.body?.limits;
  if (!requestedLimits || typeof requestedLimits !== "object" || Array.isArray(requestedLimits)) {
    return res.status(400).json({ message: "limits must be an object containing relay limits." });
  }

  const limits = { ...budget.limits };
  for (const key of relayKeys) {
    if (requestedLimits[key] !== undefined) {
      const limit = Number(requestedLimits[key]);
      if (!Number.isFinite(limit) || limit < 0) {
        return res.status(400).json({ message: `${key} limit must be a non-negative number.` });
      }
      limits[key] = limit;
    }
  }

  budget.ratePerKwh = ratePerKwh;
  budget.limits = limits;
  budget.tripped = Object.fromEntries(
    relayKeys.map((key) => [key, budget.tripped[key] && limits[key] > 0]),
  );

  if (req.body?.resetCosts === true) {
    budget.costs = Object.fromEntries(relayKeys.map((key) => [key, 0]));
    budget.tripped = Object.fromEntries(relayKeys.map((key) => [key, false]));
  }

  try {
    for (const key of relayKeys) {
      if (budget.limits[key] > 0 && budget.costs[key] >= budget.limits[key]) {
        budget.tripped[key] = true;
        forceRelayOff(Number(key.replace("relay", "")));
      }
    }
    await persistBudget();
    return res.json(budget);
  } catch (error) {
    console.error("Energy budget update error:", error);
    return res.status(500).json({ message: "Unable to save energy budget." });
  }
};

export const recordEnergyUsage = async (outletId, energyKwh) => {
  const key = `relay${outletId}`;
  if (!relayKeys.includes(key)) return;

  const currentEnergy = numericValue(energyKwh);
  const previousEnergy = numericValue(budget.lastEnergy[key]);
  const delta = currentEnergy >= previousEnergy ? currentEnergy - previousEnergy : 0;
  budget.lastEnergy[key] = currentEnergy;

  if (delta === 0 || budget.ratePerKwh === 0 || budget.tripped[key]) {
    await persistBudget();
    return;
  }

  budget.costs[key] = numericValue(budget.costs[key]) + delta * budget.ratePerKwh;
  const limit = numericValue(budget.limits[key]);
  if (limit > 0 && budget.costs[key] >= limit) {
    budget.tripped[key] = true;
    forceRelayOff(outletId);
  }

  await persistBudget();
};
