import express from "express";
import { receiveTextbeeWebhook } from "../controller/textbeeController.js";

const router = express.Router();

// TextBee signs the exact request bytes, so this route must receive the raw body.
router.post("/webhook", express.raw({ type: "application/json", limit: "32kb" }), receiveTextbeeWebhook);

export default router;
