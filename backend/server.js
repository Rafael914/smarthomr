import dotenv from "dotenv";
dotenv.config();
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import path from "path";

import relayRoutes from "./routes/relayRoutes.js";
import pzemRoutes from "./routes/pzemRoutes.js"
// import { aj } from "./lib/arcjet.js";
import { sql } from "./config/db.js";
import authRoutes from './routes/authRoutes.js'
import geofenceRoutes from "./routes/geofenceRoutes.js";
import { initGeofenceTable } from "./controller/geofenceController.js";

// ========================
// LOAD ENV FIRST
// ========================


const app = express();
const PORT = process.env.PORT || 8000;
const __dirname = path.resolve();

// ========================
// MIDDLEWARE
// ========================
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));

// ========================
// ARCJET PROTECTION
// ========================
// app.use(async (req, res, next) => {
//   try {
//     const decision = await aj.protect(req, { requested: 1 });

//     if (decision.isDenied()) {
//       if (decision.reason.isRateLimit()) {
//         return res.status(429).json({ error: "Too Many Requests" });
//       }

//       if (decision.reason.isBot()) {
//         return res.status(403).json({ error: "Bot access denied" });
//       }

//       return res.status(403).json({ error: "Forbidden" });
//     }

//     next();
//   } catch (error) {
//     console.log("Arcjet error:", error);
//     next();
//   }
// });

app.use("/api/relay", relayRoutes);
app.use("/api/pzem", pzemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/geofence', geofenceRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Smart Home Backend is running 🚀" });
});


async function initDB() {
  await initGeofenceTable();
}

// ========================
// START SERVER
// ========================
initDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at: http://192.168.137.1:${PORT}`);
  });
});