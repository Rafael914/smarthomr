import express from "express";
import { authenticate, requireAdmin } from "../controller/authController.js";
import { getRelayAuditLog } from "../controller/auditController.js";

const router = express.Router();

router.get("/", authenticate, requireAdmin, getRelayAuditLog);

export default router;
