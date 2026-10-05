import express from "express";
import {
  addReading,   
  getAllLatestReadings,
  getPzemHistory
} from "../controller/pzemController.js";

const router = express.Router();

// Maps endpoints cleanly so both GET and POST mount straight to "/api/pzem"
router.post("/", addReading);
router.get("/", getAllLatestReadings);             
router.get("/history", getPzemHistory);

export default router;