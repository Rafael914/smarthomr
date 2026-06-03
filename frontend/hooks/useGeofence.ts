// hooks/useGeofence.ts
import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import axios from "axios";
import { Storage } from "../utils/storage";
import { BASE_URL } from "../utils/api";

const GEOFENCE_TASK = "geofenceTask";

// Define the background task
TaskManager.defineTask(GEOFENCE_TASK, async () => {
  try {
    const location = await Location.getCurrentPositionAsync({});
    const token = await Storage.getItem("token");
    const userId = await Storage.getItem("userId");

    if (!token || !userId) return;

    // Check geofence distance
    const response = await axios.post(
      `${BASE_URL}/api/geofence/check-distance`,
      {
        userId: parseInt(userId),
        currentLatitude: location.coords.latitude,
        currentLongitude: location.coords.longitude,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // If too far from home, disable all relays
    if (response.data.shouldDisableRelays) {
      await axios.post(
        `${BASE_URL}/api/relay`,
        {
          relay1: false,
          relay2: false,
          relay3: false,
          relay4: false,
          relay5: false,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("🚨 Geofence triggered: All relays disabled");
    }
  } catch (error) {
    console.error("Geofence task error:", error);
  }
});

export const useGeofence = () => {
  const geofenceEnabledRef = useRef(false);
  const webWatchIdRef = useRef<number | null>(null);

  const checkDistanceAndDisableRelays = useCallback(
    async (latitude: number, longitude: number) => {
      const token = await Storage.getItem("token");
      const userId = await Storage.getItem("userId");

      if (!token || !userId) return;

      const response = await axios.post(
        `${BASE_URL}/api/geofence/check-distance`,
        {
          userId: parseInt(userId),
          currentLatitude: latitude,
          currentLongitude: longitude,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.shouldDisableRelays) {
        await axios.post(
          `${BASE_URL}/api/relay`,
          {
            relay1: false,
            relay2: false,
            relay3: false,
            relay4: false,
            relay5: false,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Geofence triggered: All relays disabled");
      }
    },
    []
  );

  // Request location permissions
  const requestLocationPermission = useCallback(async () => {
    try {
      // Request foreground location permission
      const foregroundStatus = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus.status !== "granted") {
        console.warn("Foreground location permission denied");
        return false;
      }

      // Request background location permission (may not always be granted)
      try {
        const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus.status !== "granted") {
          console.warn("Background location permission not granted - app will only track when in foreground");
        }
      } catch (error) {
        // Background permissions might not be available on all platforms
        console.warn("Background location permissions not available:", error);
      }

      return true;
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return false;
    }
  }, []);

  // Start geofence tracking
  const startGeofenceTracking = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        const webNavigator = globalThis.navigator as any;

        if (!webNavigator?.geolocation) {
          console.warn("Web geolocation is not available in this browser");
          return false;
        }

        if (webWatchIdRef.current !== null) {
          webNavigator.geolocation.clearWatch(webWatchIdRef.current);
        }

        const options = {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 20000,
        };

        webWatchIdRef.current = webNavigator.geolocation.watchPosition(
          (position: GeolocationPosition) => {
            checkDistanceAndDisableRelays(
              position.coords.latitude,
              position.coords.longitude
            );
          },
          (error: GeolocationPositionError) => {
            console.warn("Web geofence location error:", error.message);
          },
          options
        );

        geofenceEnabledRef.current = true;
        console.log("Web geofence tracking started");
        return true;
      }

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return false;

      // Check if task is already defined
      const isTaskDefined = TaskManager.isTaskDefined(GEOFENCE_TASK);
      if (!isTaskDefined) {
        console.warn("Geofence task not defined");
        return false;
      }

      // Start location monitoring in background (updates every 5 minutes or 50 meters moved)
      await Location.startLocationUpdatesAsync(GEOFENCE_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 300000, // 5 minutes
        distanceInterval: 50, // 50 meters
        foregroundService: {
          notificationTitle: "Location Tracking",
          notificationBody: "Geofence is active",
        },
      });

      geofenceEnabledRef.current = true;
      console.log("✅ Geofence tracking started");
      return true;
    } catch (error) {
      console.error("Error starting geofence tracking:", error);
      return false;
    }
  }, [checkDistanceAndDisableRelays, requestLocationPermission]);

  // Stop geofence tracking
  const stopGeofenceTracking = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        const webNavigator = globalThis.navigator as any;

        if (webWatchIdRef.current !== null) {
          webNavigator?.geolocation?.clearWatch(webWatchIdRef.current);
          webWatchIdRef.current = null;
        }

        geofenceEnabledRef.current = false;
        console.log("Web geofence tracking stopped");
        return true;
      }

      await Location.stopLocationUpdatesAsync(GEOFENCE_TASK);
      geofenceEnabledRef.current = false;
      console.log("⏹️ Geofence tracking stopped");
      return true;
    } catch (error) {
      console.error("Error stopping geofence tracking:", error);
      return false;
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  }, [requestLocationPermission]);

  // Check geofence status
  const checkGeofenceStatus = useCallback(async () => {
    try {
      const userId = await Storage.getItem("userId");
      const token = await Storage.getItem("token");

      if (!userId || !token) return null;

      const response = await axios.get(
        `${BASE_URL}/api/geofence/settings/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error checking geofence status:", error);
      return null;
    }
  }, []);

  // Set home location
  const setHomeLocation = useCallback(async () => {
    try {
      console.log("Getting current location...");
      const location = await getCurrentLocation();
      if (!location) {
        console.error("Could not get location - permission denied or GPS unavailable");
        return false;
      }

      console.log("Location obtained:", location);

      const userId = await Storage.getItem("userId");
      const token = await Storage.getItem("token");

      console.log("UserId:", userId, "Token exists:", !!token);

      if (!userId || !token) {
        console.error("Missing userId or token in Storage");
        return false;
      }

      console.log("Sending home location to backend...");
      await axios.post(
        `${BASE_URL}/api/geofence/set-home`,
        {
          userId: parseInt(userId),
          latitude: location.latitude,
          longitude: location.longitude,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Home location set successfully");
      return true;
    } catch (error) {
      console.error("Error setting home location:", error);
      return false;
    }
  }, [getCurrentLocation]);

  // Toggle geofence on/off
  const toggleGeofence = useCallback(
    async (enabled: boolean) => {
      try {
        const userId = await Storage.getItem("userId");
        const token = await Storage.getItem("token");

        if (!userId || !token) return false;

        await axios.post(
          `${BASE_URL}/api/geofence/toggle`,
          {
            userId: parseInt(userId),
            enabled: enabled,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (enabled) {
          await startGeofenceTracking();
        } else {
          await stopGeofenceTracking();
        }

        console.log(`Geofence ${enabled ? "enabled" : "disabled"}`);
        return true;
      } catch (error) {
        console.error("Error toggling geofence:", error);
        return false;
      }
    },
    [startGeofenceTracking, stopGeofenceTracking]
  );

  return {
    startGeofenceTracking,
    stopGeofenceTracking,
    getCurrentLocation,
    checkGeofenceStatus,
    setHomeLocation,
    toggleGeofence,
    geofenceEnabledRef,
  };
};
