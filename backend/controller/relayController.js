import { sql } from "../config/db.js";

let relayState = {
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
    relay5: false, 
    auto: false
};

const relayKeys = ["relay1", "relay2", "relay3", "relay4", "relay5", "auto"];

const persistRelayState = async (state) => {
    await sql`
        INSERT INTO relay_state (id, state, updated_at)
        VALUES (1, ${JSON.stringify(state)}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE
        SET state = EXCLUDED.state, updated_at = NOW()
    `;
};

export const initRelayStateTable = async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS relay_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            state JSONB NOT NULL DEFAULT '{"relay1":false,"relay2":false,"relay3":false,"relay4":false,"relay5":false,"auto":false}'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS relay_audit_log (
            id BIGSERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            relay TEXT NOT NULL CHECK (relay IN ('relay1','relay2','relay3','relay4','relay5')),
            action TEXT NOT NULL CHECK (action IN ('ON','OFF')),
            occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
    await sql`
        CREATE INDEX IF NOT EXISTS relay_audit_log_occurred_at_idx
        ON relay_audit_log (occurred_at DESC)
    `;

    await sql`
        INSERT INTO relay_state (id, state)
        VALUES (1, ${JSON.stringify(relayState)}::jsonb)
        ON CONFLICT (id) DO NOTHING
    `;

    const rows = await sql`SELECT state FROM relay_state WHERE id = 1`;
    if (rows[0]?.state) {
        relayState = { ...relayState, ...rows[0].state };
    }
    console.log("Relay state initialized from database");
};

export const forceRelayOff = async (outletId) => {
    const key = `relay${outletId}`;
    if (Object.prototype.hasOwnProperty.call(relayState, key)) {
        const nextState = { ...relayState, [key]: false };
        await persistRelayState(nextState);
        relayState = nextState;
        console.log(`Automatically turned off ${key}: energy cost limit reached.`);
    }
};

export const getRelayState = async (req, res) => {
    try {
        res.status(200).json(relayState);
    } catch (error) {
        res.status(500).json({ error: "getRelay server error" });
    }
};

export const postUpdateRelay = async (req, res) => {
    try {
        console.log("Incoming request body:", req.body);

        const nextState = { ...relayState };
        for (const key of relayKeys) {
            if (req.body?.[key] !== undefined) {
                if (typeof req.body[key] !== "boolean") {
                    return res.status(400).json({ success: false, message: `${key} must be a boolean` });
                }
                nextState[key] = req.body[key];
            }
        }

        const changedRelays = relayKeys
            .filter((key) => key.startsWith("relay") && nextState[key] !== relayState[key]);

        await persistRelayState(nextState);
        for (const relay of changedRelays) {
            await sql`
                INSERT INTO relay_audit_log (user_id, username, email, relay, action)
                VALUES (${req.user.id}, ${req.user.name}, ${req.user.email}, ${relay}, ${nextState[relay] ? "ON" : "OFF"})
            `;
        }
        relayState = nextState;

        console.log("Updated state:", relayState);

        res.status(200).json({
            success: true,
            data: relayState
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false
        });
    }
};

export const getRelayAuditLog = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 500);
        const rows = await sql`
            SELECT id, user_id, username, email, relay, action, occurred_at
            FROM relay_audit_log
            ORDER BY occurred_at DESC, id DESC
            LIMIT ${limit}
        `;
        res.status(200).json({ success: true, entries: rows });
    } catch (error) {
        console.error("RELAY AUDIT LOG ERROR:", error);
        res.status(500).json({ success: false, message: "Could not load relay audit log" });
    }
};
