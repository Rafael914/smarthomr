import express from "express";
import {
  addReading,   
  getAllLatestReadings
} from "../controller/pzemController.js";

const router = express.Router();

router.post("/reading", addReading);

router.get("/latest", getAllLatestReadings);             

export default router;