import { sql } from "../config/db.js";
import { recordEnergyUsage } from "./energyBudgetController.js";

// Memory storage for live monitoring
let liveData = {
  pzem1: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
  pzem2: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
  pzem3: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
  pzem4: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
  pzem5: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
};

// Track previous readings globally so it doesn't cause a reference error crash
let lastEnergy = {
  pzem1: 0,
  pzem2: 0,
  pzem3: 0,
  pzem4: 0,
  pzem5: 0,
};

export const initPzemReadingsTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS readings (
      id SERIAL PRIMARY KEY,
      outlet_id INTEGER NOT NULL,
      voltage NUMERIC NOT NULL DEFAULT 0,
      current NUMERIC NOT NULL DEFAULT 0,
      power NUMERIC NOT NULL DEFAULT 0,
      energy_kwh NUMERIC NOT NULL DEFAULT 0,
      hourly_used_kwh NUMERIC NOT NULL DEFAULT 0,
      frequency NUMERIC NOT NULL DEFAULT 0,
      pf NUMERIC NOT NULL DEFAULT 0,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Keep existing installations compatible with the current history queries.
  // Older databases have a `readings` table without this column, so the
  // CREATE TABLE statement above is not enough when the table already exists.
  await sql`
    ALTER TABLE readings
    ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS readings_recorded_at_idx
    ON readings (recorded_at)
  `;

  const latestReadings = await sql`
    SELECT DISTINCT ON (outlet_id) outlet_id, energy_kwh
    FROM readings
    ORDER BY outlet_id, recorded_at DESC
  `;

  latestReadings.forEach((reading) => {
    const key = `pzem${reading.outlet_id}`;
    if (key in lastEnergy) {
      lastEnergy[key] = Number(reading.energy_kwh) || 0;
    }
  });
};

/**
 * 1. ADD READING (Memory Only)
 * ESP32 calls this every 2 seconds sending an array payload.
 */
export const addReading = async (req, res) => {
  try {
    const readingsArray = req.body;

    if (Array.isArray(readingsArray)) {
      readingsArray.forEach((item) => {
        const { outlet_id, voltage, current, power, energy, frequency, pf } = item;
        
        // Extract metrics nicely matching the incoming ESP32 JSON schema
        const metrics = { voltage, current, power, energy, frequency, pf };

        const id = Number(outlet_id);
        if (Number.isInteger(id) && id >= 1 && id <= 5) {
          liveData[`pzem${id}`] = metrics;
          recordEnergyUsage(id, energy).catch((error) => {
            console.error("Energy budget update error:", error);
          });
        }
      });
    }

    return res.status(200).json({ message: "Live data updated" });
  } catch (error) {
    console.error("Error updating live data:", error);
    return res.status(500).json({ message: "Error updating live data" });
  }
};

/**
 * 2. GET LATEST (Fetch from Memory)
 * React Native calls this every 2 seconds for the dashboard view.
 */
export const getAllLatestReadings = (req, res) => {
  const dataArray = [
    { outlet_id: 1, ...liveData.pzem1, outlet_name: "Outlet 1" },
    { outlet_id: 2, ...liveData.pzem2, outlet_name: "Outlet 2" },
    { outlet_id: 3, ...liveData.pzem3, outlet_name: "Outlet 3" },
    { outlet_id: 4, ...liveData.pzem4, outlet_name: "Outlet 4" },
    { outlet_id: 5, ...liveData.pzem5, outlet_name: "Outlet 5" },
  ];
  return res.json(dataArray);
};

export const getPzemHistory = async (req, res) => {
  try {
    const [hourly, daily, monthly] = await Promise.all([
      sql`
        SELECT
          date_trunc('hour', recorded_at) AS period,
          SUM(hourly_used_kwh) AS total_kwh
        FROM readings
        WHERE recorded_at >= NOW() - INTERVAL '24 hours'
        GROUP BY 1
        ORDER BY period DESC
      `,
      sql`
        SELECT
          date_trunc('day', recorded_at) AS period,
          SUM(hourly_used_kwh) AS total_kwh
        FROM readings
        WHERE recorded_at >= date_trunc('day', NOW())
        GROUP BY 1
        ORDER BY period DESC
      `,
      sql`
        SELECT
          date_trunc('month', recorded_at) AS period,
          SUM(hourly_used_kwh) AS total_kwh
        FROM readings
        WHERE recorded_at >= date_trunc('month', NOW()) - INTERVAL '11 months'
        GROUP BY 1
        ORDER BY period DESC
      `,
    ]);

    return res.json({ hourly, daily, monthly });
  } catch (error) {
    console.error("PZEM history error:", error);
    return res.status(500).json({ message: "Unable to load PZEM history" });
  }
};

/**
 * 3. BACKGROUND TASK: SAVE TO DATABASE
 * This function runs every 1 hour (3600000 ms).
 */
export const saveToDatabase = async () => {
  try {
    console.log("Saving hourly snapshot...");

    const pzemMap = [
      { id: 1, key: "pzem1", data: liveData.pzem1 },
      { id: 2, key: "pzem2", data: liveData.pzem2 },
      { id: 3, key: "pzem3", data: liveData.pzem3 },
      { id: 4, key: "pzem4", data: liveData.pzem4 },
      { id: 5, key: "pzem5", data: liveData.pzem5 },
    ];

    for (const outlet of pzemMap) {
      const currentEnergy = outlet.data.energy || 0;
      const previousEnergy = lastEnergy[outlet.key] || 0;

      // Delta math calculation for consumption trends
      const hourlyUsed = currentEnergy - previousEnergy;
      const safeHourlyUsed = hourlyUsed < 0 ? 0 : hourlyUsed;

      await sql`
        INSERT INTO readings (
          outlet_id,
          voltage,
          current,
          power,
          energy_kwh,
          hourly_used_kwh,
          frequency,
          pf
        )
        VALUES (
          ${outlet.id},
          ${outlet.data.voltage},
          ${outlet.data.current},
          ${outlet.data.power},
          ${currentEnergy},
          ${safeHourlyUsed},
          ${outlet.data.frequency},
          ${outlet.data.pf}
        )
      `;

      // Cache current layout configuration for the next hour comparison
      lastEnergy[outlet.key] = currentEnergy;
    }

    console.log("Saved successfully.");
  } catch (error) {
    console.error("Database Save Error:", error);
  }
};

// Start hourly scheduler loop
setInterval(saveToDatabase, 3600000);
