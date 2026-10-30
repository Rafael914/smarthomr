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

        await persistRelayState(nextState);
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
