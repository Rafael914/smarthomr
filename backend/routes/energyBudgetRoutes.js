import express from "express";
import {
  getEnergyBudget,
  updateEnergyBudget,
} from "../controller/energyBudgetController.js";

const router = express.Router();

router.get("/", getEnergyBudget);
router.put("/", updateEnergyBudget);

export default router;
