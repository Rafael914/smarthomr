import express from "express";
import {
  addReading,   
  getAllLatestReadings
} from "../controller/pzemController.js";

const router = express.Router();

// Maps endpoints cleanly so both GET and POST mount straight to "/api/pzem"
router.post("/", addReading);
router.get("/", getAllLatestReadings);             

export default router;