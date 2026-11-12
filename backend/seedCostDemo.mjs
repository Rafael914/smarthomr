import { sql } from "./config/db.js";

const budget = await sql`SELECT rate_per_kwh FROM energy_budget WHERE id = 1`;
const savedRate = Number(budget[0]?.rate_per_kwh) || 0;
if (savedRate <= 0) {
  await sql`UPDATE energy_budget SET rate_per_kwh = 12 WHERE id = 1`;
  console.log("Set demo electricity rate to PHP 12.00/kWh.");
}

const users = await sql`SELECT id FROM users ORDER BY id LIMIT 1`;
if (!users.length) {
  throw new Error("No user exists yet; create an account before seeding the demo readings.");
}
const userId = users[0].id;
const outlets = await sql`SELECT id FROM outlets ORDER BY id LIMIT 5`;
if (!outlets.length) {
  throw new Error("No outlets exist yet; add outlets before seeding the demo readings.");
}

// Hourly demo samples for November 8–11, 2026 (Manila time).
const start = new Date("2026-11-08T00:00:00+08:00");
const end = new Date("2026-11-12T00:00:00+08:00");
let inserted = 0;

for (let recordedAt = new Date(start), hour = 0; recordedAt < end; recordedAt = new Date(recordedAt.getTime() + 60 * 60 * 1000), hour += 1) {
  for (let outletIndex = 0; outletIndex < outlets.length; outletIndex += 1) {
    const outletId = outlets[outletIndex].id;
    const hourlyUsed = Number((0.012 + (outletIndex + 1) * 0.004 + ((hour + outletIndex + 1) % 5) * 0.006).toFixed(3));
    const power = Math.round(120 + (outletIndex + 1) * 38 + (hour % 6) * 22);
    const alreadySeeded = await sql`
      SELECT 1 FROM readings
      WHERE user_id = ${userId} AND outlet_id = ${outletId}
        AND date_trunc('hour', recorded_at) = ${recordedAt.toISOString()}::timestamptz
      LIMIT 1
    `;
    if (alreadySeeded.length) continue;
    await sql`
      INSERT INTO readings (
        user_id, outlet_id, voltage, current, power, energy_kwh,
        hourly_used_kwh, frequency, pf, recorded_at
      ) VALUES (
        ${userId}, ${outletId}, 230, ${Number((power / 230).toFixed(3))}, ${power},
        ${Number((hourlyUsed * 24).toFixed(3))}, ${hourlyUsed}, 60, 0.95,
        ${recordedAt.toISOString()}::timestamptz
      )
    `;
    inserted += 1;
  }
}

const totals = await sql`
  SELECT COUNT(*)::int AS rows, ROUND(SUM(hourly_used_kwh)::numeric, 3) AS kwh
  FROM readings
  WHERE recorded_at >= ${start.toISOString()}::timestamptz
    AND recorded_at < ${end.toISOString()}::timestamptz
`;
console.log(`Inserted ${inserted} synthetic hourly reading rows for ${outlets.length} configured outlets, November 8–11, 2026 (Manila time).`);
console.log(`History for November 8–11: ${totals[0]?.rows ?? 0} rows, ${totals[0]?.kwh ?? 0} kWh.`);
console.log("The demo rate is PHP 12.00/kWh only if no rate was already saved.");
