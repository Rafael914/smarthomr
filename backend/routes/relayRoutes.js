import express from "express";
import { authenticate } from "../controller/authController.js";
import {
    getRelayState,
    postUpdateRelay
} from "../controller/relayController.js";

const router = express.Router();

router.get("/", getRelayState);
router.post("/", authenticate, postUpdateRelay);

export default router;

