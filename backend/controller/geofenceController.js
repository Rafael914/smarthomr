// geofenceController.js
import { sql } from "../config/db.js";

// Initialize geofence table
export const initGeofenceTable = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS geofence_settings (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        home_latitude DECIMAL(10, 8),
        home_longitude DECIMAL(11, 8),
        geofence_enabled BOOLEAN DEFAULT false,
        radius_meters INT DEFAULT 250,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `;
    console.log("✅ Geofence table initialized");
  } catch (error) {
    console.error("Error initializing geofence table:", error);
  }
};

// Get geofence settings for a user
export const getGeofenceSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await sql`
      SELECT * FROM geofence_settings WHERE user_id = ${userId}
    `;

    if (result.length === 0) {
      const defaultSettings = await sql`
        INSERT INTO geofence_settings (user_id, geofence_enabled, radius_meters)
        VALUES (${userId}, false, 250)
        RETURNING *
      `;
      return res.status(200).json(defaultSettings[0]);
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error("Error fetching geofence settings:", error);
    res.status(500).json({ error: "Failed to fetch geofence settings" });
  }
};

// Set or update home location
export const setHomeLocation = async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // BUG FIX: parse to float so DB stores actual numbers, not strings
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: "Invalid latitude/longitude — must be valid numbers" });
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: "Coordinates out of valid range" });
    }

    const existing = await sql`
      SELECT * FROM geofence_settings WHERE user_id = ${userId}
    `;

    let result;
    if (existing.length === 0) {
      result = await sql`
        INSERT INTO geofence_settings (user_id, home_latitude, home_longitude)
        VALUES (${userId}, ${lat}, ${lon})
        RETURNING *
      `;
    } else {
      result = await sql`
        UPDATE geofence_settings 
        SET home_latitude = ${lat}, home_longitude = ${lon}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
    }

    console.log(`✅ Home location set for user ${userId}: lat=${lat}, lon=${lon}`);

    res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Error setting home location:", error);
    res.status(500).json({ error: "Failed to set home location" });
  }
};

// Toggle geofence feature
export const toggleGeofence = async (req, res) => {
  try {
    const { userId, enabled } = req.body;

    if (!userId || enabled === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await sql`
      SELECT * FROM geofence_settings WHERE user_id = ${userId}
    `;

    let result;
    if (existing.length === 0) {
      result = await sql`
        INSERT INTO geofence_settings (user_id, geofence_enabled)
        VALUES (${userId}, ${enabled})
        RETURNING *
      `;
    } else {
      result = await sql`
        UPDATE geofence_settings 
        SET geofence_enabled = ${enabled}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;
    }

    console.log(`✅ Geofence ${enabled ? "enabled" : "disabled"} for user ${userId}`);

    res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Error toggling geofence:", error);
    res.status(500).json({ error: "Failed to toggle geofence" });
  }
};

// Check distance and enforce geofence
export const checkGeofenceDistance = async (req, res) => {
  try {
    const { userId, currentLatitude, currentLongitude } = req.body;

    if (!userId || currentLatitude === undefined || currentLongitude === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const settings = await sql`
      SELECT * FROM geofence_settings WHERE user_id = ${userId}
    `;

    if (settings.length === 0 || !settings[0].geofence_enabled) {
      return res.status(200).json({
        geofenceEnabled: false,
        shouldDisableRelays: false,
        message: "Geofence not enabled or not configured",
      });
    }

    const { home_latitude, home_longitude, radius_meters } = settings[0];

    if (!home_latitude || !home_longitude) {
      return res.status(200).json({
        geofenceEnabled: true,
        shouldDisableRelays: false,
        message: "Home location not set",
      });
    }

    // BUG FIX: PostgreSQL DECIMAL columns return strings in JS — must parseFloat
    const homeLat = parseFloat(home_latitude);
    const homeLon = parseFloat(home_longitude);
    const curLat  = parseFloat(currentLatitude);
    const curLon  = parseFloat(currentLongitude);

    // Guard: if any coord is NaN, Haversine returns NaN and shouldDisable is always false
    if (isNaN(homeLat) || isNaN(homeLon) || isNaN(curLat) || isNaN(curLon)) {
      console.error("❌ NaN coordinates detected:", { homeLat, homeLon, curLat, curLon });
      return res.status(400).json({
        error: "Invalid coordinates — NaN detected after parseFloat",
        debug: { home_latitude, home_longitude, currentLatitude, currentLongitude },
      });
    }

    const distance = calculateDistance(homeLat, homeLon, curLat, curLon);
    const shouldDisable = distance > radius_meters;

    console.log(
      `📍 User ${userId} | Distance: ${Math.round(distance)}m | Radius: ${radius_meters}m | Disable: ${shouldDisable}`
    );

    res.status(200).json({
      geofenceEnabled: true,
      shouldDisableRelays: shouldDisable,
      distance: Math.round(distance),
      radius: radius_meters,
      message: shouldDisable
        ? "Too far from home — relays will be disabled"
        : "Within geofence zone",
    });
  } catch (error) {
    console.error("Error checking geofence distance:", error);
    res.status(500).json({ error: "Failed to check geofence distance" });
  }
};

// Haversine formula — returns distance in meters between two lat/lon points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
}

// Update geofence radius
export const updateRadius = async (req, res) => {
  try {
    const { userId, radiusMeters } = req.body;

    if (!userId || radiusMeters === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // BUG FIX: parse to int so "250" string from request body doesn't slip through
    const radius = parseInt(radiusMeters, 10);

    if (isNaN(radius) || radius < 50 || radius > 50000) {
      return res.status(400).json({ error: "Radius must be a number between 50 and 50000 meters" });
    }

    const result = await sql`
      UPDATE geofence_settings 
      SET radius_meters = ${radius}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: "Geofence settings not found for this user" });
    }

    console.log(`✅ Radius updated for user ${userId}: ${radius}m`);

    res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Error updating radius:", error);
    res.status(500).json({ error: "Failed to update radius" });
  }
};