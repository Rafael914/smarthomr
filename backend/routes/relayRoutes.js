import express from "express";
import { authenticate, requireAdmin } from "../controller/authController.js";
import {
    getRelayState,
    getRelayAuditLog,
    postUpdateRelay
} from "../controller/relayController.js";

const router = express.Router();

router.get("/", getRelayState);
router.get("/audit", authenticate, requireAdmin, getRelayAuditLog);
router.post("/", authenticate, postUpdateRelay);

export default router;

