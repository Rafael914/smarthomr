// components/GeofenceSettings.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useGeofence } from "../hooks/useGeofence";
import { Storage } from "../utils/storage";
import axios from "axios";
import { BASE_URL } from "../utils/api";

interface GeofenceSettings {
  geofence_enabled: boolean;
  home_latitude?: number;
  home_longitude?: number;
  radius_meters: number;
}

const POLL_INTERVAL_MS = 10_000; // 10 seconds

export const GeofenceSettings: React.FC = () => {
  const {
    setHomeLocation,
    toggleGeofence,
    getCurrentLocation,
    checkGeofenceStatus,
  } = useGeofence();

  const [settings, setSettings] = useState<GeofenceSettings>({
    geofence_enabled: false,
    radius_meters: 500,
  });

  // Split loading states — each button is independent
  const [loadingHome, setLoadingHome] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Keep a ref to latest settings so the interval callback always has fresh data
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Haversine distance in metres */
  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6_371_000;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // ─── Load settings on mount ─────────────────────────────────────────────────

  const loadGeofenceSettings = async () => {
    try {
      const status = await checkGeofenceStatus();
      if (status) setSettings(status);
    } catch (error) {
      console.error("Error loading geofence settings:", error);
    }
  };

  useEffect(() => {
    loadGeofenceSettings();
  }, []);

  // ─── Fetch current location (reusable, silent) ───────────────────────────────

  /**
   * Fetches the device's current location and updates state.
   * Pass `silent = true` to skip showing an error Alert (used by the auto-poll).
   */
  const fetchLocation = useCallback(
    async (silent = false) => {
      try {
        const location = await getCurrentLocation();
        if (!location) {
          if (!silent) Alert.alert("Error", "Could not get your location");
          return;
        }

        setCurrentLocation(location);

        const { home_latitude, home_longitude } = settingsRef.current;
        if (home_latitude && home_longitude) {
          const dist = calculateDistance(
            home_latitude,
            home_longitude,
            location.latitude,
            location.longitude
          );
          setDistance(dist);
        }
      } catch {
        if (!silent) Alert.alert("Error", "Failed to get location");
      }
    },
    [getCurrentLocation]
  );

  // ─── Auto-poll while home location is set ───────────────────────────────────

  useEffect(() => {
    if (!settings.home_latitude || !settings.home_longitude) {
      // Clear distance display when home is removed
      setDistance(null);
      return;
    }

    // Fetch immediately, then on a fixed interval
    fetchLocation(true);
    const interval = setInterval(() => fetchLocation(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [settings.home_latitude, settings.home_longitude, fetchLocation]);

  // ─── Manual "Get Current Location" button ───────────────────────────────────

  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);
    await fetchLocation(false);
    setLoadingLocation(false);
  };

  // ─── Set home location ───────────────────────────────────────────────────────

  const handleSetHomeLocation = async () => {
    setLoadingHome(true);
    try {
      const userId = await Storage.getItem("userId");
      const token = await Storage.getItem("token");

      if (!userId) {
        Alert.alert("❌ Error", "User ID not found. Please log in again.");
        return;
      }
      if (!token) {
        Alert.alert("❌ Error", "Auth token not found. Please log in again.");
        return;
      }

      const success = await setHomeLocation();
      if (success) {
        Alert.alert("✅ Success", "Home location saved!");
        await loadGeofenceSettings();
      } else {
        Alert.alert(
          "❌ Error",
          "Failed to set home location. Check backend connectivity."
        );
      }
    } catch (error) {
      console.error("Detailed error:", error);
      Alert.alert("❌ Error", `Failed to set home location: ${error}`);
    } finally {
      setLoadingHome(false);
    }
  };

  // ─── Toggle geofence ─────────────────────────────────────────────────────────

  const handleToggleGeofence = async (value: boolean) => {
    if (value && (!settings.home_latitude || !settings.home_longitude)) {
      Alert.alert(
        "⚠️ Home Location Not Set",
        "Please set your home location first before enabling geofence.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoadingToggle(true);
    try {
      const success = await toggleGeofence(value);
      if (success) {
        setSettings((prev) => ({ ...prev, geofence_enabled: value }));
        Alert.alert("Success", `Geofence ${value ? "enabled" : "disabled"}!`);
      } else {
        Alert.alert("Error", "Failed to toggle geofence");
      }
    } catch {
      Alert.alert("Error", "Failed to toggle geofence");
    } finally {
      setLoadingToggle(false);
    }
  };

  // ─── Update radius ───────────────────────────────────────────────────────────

  const handleUpdateRadius = async (newRadius: number) => {
    try {
      const userId = await Storage.getItem("userId");
      const token = await Storage.getItem("token");

      if (!userId || !token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      await axios.post(
        `${BASE_URL}/api/geofence/update-radius`,
        { userId: parseInt(userId), radiusMeters: newRadius },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSettings((prev) => ({ ...prev, radius_meters: newRadius }));
      Alert.alert("✅ Success", `Geofence radius updated to ${newRadius}m`);
    } catch {
      Alert.alert("Error", "Failed to update radius");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const isOutside =
    distance !== null && distance > settings.radius_meters;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.card}>
        <Text style={styles.title}>🏠 Geofence Settings</Text>

        {/* ── Geofence Toggle ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Enable Geofence</Text>
            {loadingToggle ? (
              <ActivityIndicator color="#00d4ff" />
            ) : (
              <Switch
                value={settings.geofence_enabled}
                onValueChange={handleToggleGeofence}
                trackColor={{ false: "#3e3e42", true: "#00d4ff" }}
                thumbColor={settings.geofence_enabled ? "#0a0a0f" : "#767676"}
              />
            )}
          </View>
          <Text style={styles.description}>
            {settings.geofence_enabled
              ? `✅ Geofence is active. All relays will turn off when you're ${settings.radius_meters}m away.`
              : "⏸️ Geofence is inactive. Enable to auto-disable relays when away."}
          </Text>
        </View>

        {/* ── Home Location ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Home Location</Text>
          <View style={styles.locationBox}>
            {settings.home_latitude && settings.home_longitude ? (
              <Text style={styles.locationText}>
                ✅ Home set at:{" "}
                {Number(settings.home_latitude).toFixed(6)},{" "}
                {Number(settings.home_longitude).toFixed(6)}
              </Text>
            ) : (
              <Text style={styles.locationText}>❌ Home location not set</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.button, loadingHome && styles.buttonDisabled]}
            onPress={handleSetHomeLocation}
            disabled={loadingHome}
          >
            {loadingHome ? (
              <ActivityIndicator color="#0a0a0f" />
            ) : (
              <Text style={styles.buttonText}>📍 Set Home Location</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Current Location ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            {settings.home_latitude && settings.home_longitude && (
              <Text style={styles.autoUpdateBadge}>🔄 Auto-updating</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loadingLocation && styles.buttonDisabled]}
            onPress={handleGetCurrentLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? (
              <ActivityIndicator color="#0a0a0f" />
            ) : (
              <Text style={styles.buttonText}>🔍 Get Current Location</Text>
            )}
          </TouchableOpacity>

          {currentLocation && (
            <View style={styles.locationBox}>
              <Text style={styles.locationText}>
                📍 Latitude: {currentLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                📍 Longitude: {currentLocation.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                📡 Accuracy: ±
                {currentLocation.accuracy
                  ? Math.round(currentLocation.accuracy)
                  : "N/A"}
                m
              </Text>
            </View>
          )}

          {distance !== null && (
            <View
              style={[styles.distanceBox, isOutside && styles.distanceFar]}
            >
              <Text style={styles.distanceText}>
                Distance from home: {distance}m
              </Text>
              {isOutside ? (
                <Text style={styles.distanceWarning}>
                  ⚠️ You are outside geofence! Relays should be OFF.
                </Text>
              ) : (
                <Text style={styles.distanceSafe}>
                  ✅ You are within geofence zone.
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── Radius Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geofence Radius</Text>
          <Text style={styles.radiusValue}>
            Current: {settings.radius_meters}m
          </Text>
          <View style={styles.radiusButtons}>
            {[250, 500, 1000].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.radiusButton,
                  settings.radius_meters === r && styles.radiusButtonActive,
                ]}
                onPress={() => handleUpdateRadius(r)}
              >
                <Text
                  style={[
                    styles.radiusButtonText,
                    settings.radius_meters === r &&
                      styles.radiusButtonTextActive,
                  ]}
                >
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Info ── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 When geofence is enabled and you move{" "}
            {settings.radius_meters}+ meters away from your home location, all
            relays will automatically turn OFF for safety. Location refreshes
            every {POLL_INTERVAL_MS / 1000}s automatically.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 800,
    marginHorizontal: "auto",
    width: "100%",
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#1a1a1f",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#00d4ff",
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00d4ff",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 10,
  },
  description: {
    fontSize: 12,
    color: "#b0b0b0",
    marginTop: 5,
  },
  autoUpdateBadge: {
    fontSize: 11,
    color: "#00d4ff",
    fontWeight: "600",
    backgroundColor: "#0a1f2e",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00d4ff",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#00d4ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#0a0a0f",
    fontWeight: "600",
    fontSize: 14,
  },
  locationBox: {
    backgroundColor: "#0a0a0f",
    borderLeftWidth: 3,
    borderLeftColor: "#00d4ff",
    padding: 12,
    marginVertical: 10,
    borderRadius: 6,
  },
  locationText: {
    color: "#e0e0e0",
    fontSize: 12,
    marginVertical: 3,
    fontFamily: "monospace",
  },
  distanceBox: {
    backgroundColor: "#1a4d2e",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#4ade80",
  },
  distanceFar: {
    backgroundColor: "#4d1a1a",
    borderLeftColor: "#ff6b6b",
  },
  distanceText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  distanceWarning: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 5,
  },
  distanceSafe: {
    color: "#4ade80",
    fontSize: 12,
    marginTop: 5,
  },
  radiusValue: {
    fontSize: 14,
    color: "#00d4ff",
    fontWeight: "600",
    marginVertical: 10,
  },
  radiusButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    flexWrap: "wrap",
  },
  radiusButton: {
    backgroundColor: "transparent",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginVertical: 5,
    minWidth: 70,
    borderWidth: 1,
    borderColor: "#00d4ff",
    alignItems: "center",
  },
  radiusButtonActive: {
    backgroundColor: "#00d4ff",
  },
  radiusButtonText: {
    color: "#00d4ff",
    fontWeight: "600",
    fontSize: 12,
  },
  radiusButtonTextActive: {
    color: "#0a0a0f",
  },
  infoBox: {
    backgroundColor: "#1a2a3f",
    borderLeftWidth: 3,
    borderLeftColor: "#4a9eff",
    padding: 12,
    borderRadius: 6,
  },
  infoText: {
    color: "#b0d4ff",
    fontSize: 12,
    lineHeight: 18,
  },
});
