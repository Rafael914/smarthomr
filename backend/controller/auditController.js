import { sql } from "../config/db.js";

export const initAuditLogTable = async () => {
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
};

export const recordRelayAuditEvent = async ({ user, relay, action }) => {
    await sql`
        INSERT INTO relay_audit_log (user_id, username, email, relay, action)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${relay}, ${action})
    `;
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
