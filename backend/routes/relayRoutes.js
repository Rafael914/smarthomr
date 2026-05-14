import express from "express";
import {
    getRelayState,
    postUpdateRelay
} from "../controller/relayController.js";

const router = express.Router();

router.get("/", getRelayState);
router.post("/", postUpdateRelay);

export default router;

