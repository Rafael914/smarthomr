import { sql } from "../config/db.js";

// Memory storage for live monitoring (similar to your moisture example)
let liveData = {
  pzem1: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
  pzem2: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
  pzem3: { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, pf: 0 },
};

/**
 * 1. ADD READING (Memory Only)
 * ESP32 calls this every 2 seconds.
 */
export const addReading = async (req, res) => {
  try {
    const { pzem1, pzem2, pzem3 } = req.body;

    // Update the live memory variables
    if (pzem1) liveData.pzem1 = pzem1;
    if (pzem2) liveData.pzem2 = pzem2;
    if (pzem3) liveData.pzem3 = pzem3;

    return res.status(200).json({ message: "Live data updated" });
  } catch (error) {
    return res.status(500).json({ message: "Error updating live data" });
  }
};

/**
 * 2. GET LATEST (Fetch from Memory)
 * React Native calls this every 2 seconds for the "Live" feel.
 */
export const getAllLatestReadings = (req, res) => {
  // Convert the object to an array format your frontend expects
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
      const currentEnergy = outlet.data.energy;

      const previousEnergy = lastEnergy[outlet.key] || 0;

      // 🔥 THIS IS WHERE hourly_used_kwh is created
      const hourlyUsed = currentEnergy - previousEnergy;

      // safety check
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

      // update last energy
      lastEnergy[outlet.key] = currentEnergy;
    }

    console.log("Saved successfully.");
  } catch (error) {
    console.error("Database Save Error:", error);
  }
};

// Start the timer: 1 hour = 60 mins * 60 secs * 1000 ms
setInterval(saveToDatabase, 3600000);