import { useEffect } from "react";
import { Platform } from "react-native";
import { useGeofence } from "../hooks/useGeofence";

export function GeofenceWebBootstrap() {
  const { checkGeofenceStatus, toggleGeofence } = useGeofence();

  useEffect(() => {
    if (Platform.OS !== "web") return;

    let active = true;
    void checkGeofenceStatus()
      .then(async (settings) => {
        if (active && settings?.geofence_enabled) {
          const started = await toggleGeofence(true);
          if (!started) {
            console.warn("Saved geofence was enabled, but browser location tracking could not start.");
            await toggleGeofence(false);
          }
        }
      })
      .catch((error) => console.error("Could not restore web geofence tracking:", error));

    return () => {
      active = false;
    };
  }, [checkGeofenceStatus, toggleGeofence]);

  return null;
}
