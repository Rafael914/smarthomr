// geofenceRoutes.js
import express from "express";
import { authenticate, requireAdmin } from "../controller/authController.js";
import {
  getGeofenceSettings,
  setHomeLocation,
  toggleGeofence,
  checkGeofenceDistance,
  updateRadius,
} from "../controller/geofenceController.js";

const router = express.Router();

// Geofence settings and relay automation are controlled by the administrator.
router.use(authenticate, requireAdmin);

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
