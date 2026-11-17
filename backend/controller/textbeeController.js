import { createHmac, timingSafeEqual } from "node:crypto";
import { applySmsRelayCommand } from "./relayController.js";

const MAX_SIGNATURE_AGE_SECONDS = 300;

const verifyTextbeeSignature = (rawBody, signatureHeader, secret) => {
    if (!signatureHeader || !secret || !Buffer.isBuffer(rawBody)) return false;

    const fields = Object.fromEntries(
        signatureHeader.split(",").map((field) => {
            const separator = field.indexOf("=");
            return separator < 0
                ? ["", ""]
                : [field.slice(0, separator).trim(), field.slice(separator + 1).trim()];
        })
    );
    const timestamp = Number(fields.t);
    const suppliedSignature = fields.v1;
    if (!Number.isInteger(timestamp) || !suppliedSignature) return false;
    if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > MAX_SIGNATURE_AGE_SECONDS) return false;

    const expectedSignature = createHmac("sha256", secret)
        .update(String(timestamp))
        .update(".")
        .update(rawBody)
        .digest("hex");
    const expected = Buffer.from(expectedSignature, "hex");
    const supplied = Buffer.from(suppliedSignature, "hex");
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
};

const normalizePhone = (phone) => String(phone || "").replace(/[\s().-]/g, "");

export const receiveTextbeeWebhook = async (req, res) => {
    const signingSecret = process.env.TEXTBEE_WEBHOOK_SECRET;
    if (!signingSecret) {
        console.error("TextBee webhook is not configured: TEXTBEE_WEBHOOK_SECRET is missing.");
        return res.status(503).json({ success: false, message: "SMS webhook is not configured" });
    }

    if (!verifyTextbeeSignature(req.body, req.get("x-textbee-signature"), signingSecret)) {
        return res.status(401).json({ success: false, message: "Invalid webhook signature" });
    }

    let event;
    try {
        event = JSON.parse(req.body.toString("utf8"));
    } catch {
        return res.status(400).json({ success: false, message: "Invalid JSON payload" });
    }

    if (event.webhookEvent !== "MESSAGE_RECEIVED") {
        return res.status(200).json({ success: true, ignored: "unsupported event" });
    }

    const allowedSenders = (process.env.TEXTBEE_ALLOWED_SENDERS || "")
        .split(",")
        .map(normalizePhone)
        .filter(Boolean);
    const sender = normalizePhone(event.sender);
    if (!allowedSenders.length || !sender || !allowedSenders.includes(sender)) {
        console.warn("Rejected TextBee command from an unapproved sender.");
        return res.status(200).json({ success: true, ignored: "sender not allowed" });
    }

    const command = String(event.message || "").trim().toLowerCase().replace(/\s+/g, "");
    const match = command.match(/^relay([1-5]):(on|off)$/);
    if (!match) {
        return res.status(200).json({ success: true, ignored: "invalid command" });
    }

    const [, relayNumber, action] = match;
    try {
        const state = await applySmsRelayCommand({
            relay: `relay${relayNumber}`,
            enabled: action === "on",
            sender,
        });
        console.log(`[TextBee SMS] ${sender} set relay${relayNumber} ${action.toUpperCase()}`);
        return res.status(200).json({ success: true, data: state });
    } catch (error) {
        console.error("Failed to apply TextBee relay command:", error);
        return res.status(500).json({ success: false, message: "Could not apply relay command" });
    }
};
