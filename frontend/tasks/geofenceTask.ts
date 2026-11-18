import * as TaskManager from "expo-task-manager";
import { checkLocationAndDisableRelays } from "../utils/geofenceEnforcement";

export const GEOFENCE_TASK = "geofenceTask";

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Geofence location task failed:", error);
    return;
  }
  const locations = (data as { locations?: Array<{ coords: { latitude: number; longitude: number } }> } | undefined)?.locations;
  const location = locations?.[locations.length - 1];
  if (!location) return;

  try {
    await checkLocationAndDisableRelays(location.coords.latitude, location.coords.longitude);
  } catch (taskError) {
    console.error("Geofence enforcement failed:", taskError);
  }
});
