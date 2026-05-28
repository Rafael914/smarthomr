import { sql } from "../config/db.js";

// Memory storage for live monitoring
let liveData = {
  pzem1: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
  pzem2: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
  pzem3: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
};

// Track previous readings globally so it doesn't cause a reference error crash
let lastEnergy = {
  pzem1: 0,
  pzem2: 0,
  pzem3: 0,
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

        if (outlet_id === 1) liveData.pzem1 = metrics;
        if (outlet_id === 2) liveData.pzem2 = metrics;
        if (outlet_id === 3) liveData.pzem3 = metrics;
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
  ];
  return res.json(dataArray);
};

/**
 * 3. BACKGROUND TASK: SAVE TO DATABASE
 * This function runs every 1 hour (3600000 ms).
 */
const saveToDatabase = async () => {
  try {
    console.log("Saving hourly snapshot...");

    const pzemMap = [
      { id: 1, key: "pzem1", data: liveData.pzem1 },
      { id: 2, key: "pzem2", data: liveData.pzem2 },
      { id: 3, key: "pzem3", data: liveData.pzem3 },
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