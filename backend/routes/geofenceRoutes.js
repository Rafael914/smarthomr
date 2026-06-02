// geofenceRoutes.js
import express from "express";
import {
  getGeofenceSettings,
  setHomeLocation,
  toggleGeofence,
  checkGeofenceDistance,
  updateRadius,
} from "../controller/geofenceController.js";

const router = express.Router();

// Get geofence settings for a user
router.get("/settings/:userId", getGeofenceSettings);

// Set home location
router.post("/set-home", setHomeLocation);

// Toggle geofence feature on/off
router.post("/toggle", toggleGeofence);

// Check current distance from home
router.post("/check-distance", checkGeofenceDistance);

// Update geofence radius
router.post("/update-radius", updateRadius);

export default router;
