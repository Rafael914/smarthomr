// components/GeofenceSettings.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useGeofence } from "../hooks/useGeofence";
import { Storage } from "../utils/storage";
import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.137.1:8000";

interface GeofenceSettings {
  geofence_enabled: boolean;
  home_latitude?: number;
  home_longitude?: number;
  radius_meters: number;
}

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
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Load geofence settings on mount
  useEffect(() => {
    loadGeofenceSettings();
  }, []);

  const loadGeofenceSettings = async () => {
    try {
      const status = await checkGeofenceStatus();
      if (status) {
        setSettings(status);
      }
    } catch (error) {
      console.error("Error loading geofence settings:", error);
      // It's OK if settings don't exist yet, user will set them up
    }
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);

        // Calculate distance from home if home location is set
        if (settings.home_latitude && settings.home_longitude) {
          const dist = calculateDistance(
            settings.home_latitude,
            settings.home_longitude,
            location.latitude,
            location.longitude
          );
          setDistance(dist);
        }
      } else {
        Alert.alert("Error", "Could not get your location");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get location");
    } finally {
      setLoading(false);
    }
  };

  // Set home location
  const handleSetHomeLocation = async () => {
    setLoading(true);
    try {
      // First check if userId and token exist
      const userId = await Storage.getItem("userId");
      const token = await Storage.getItem("token");

      if (!userId) {
        Alert.alert("❌ Error", "User ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      if (!token) {
        Alert.alert("❌ Error", "Auth token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const success = await setHomeLocation();
      if (success) {
        Alert.alert("✅ Success", "Home location saved!");
        await loadGeofenceSettings();
      } else {
        Alert.alert("❌ Error", "Failed to set home location. Check backend connectivity.");
      }
    } catch (error) {
      console.error("Detailed error:", error);
      Alert.alert("❌ Error", `Failed to set home location: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle geofence
  const handleToggleGeofence = async (value: boolean) => {
    setLoading(true);
    try {
      // Check if home location is set
      if (value && (!settings.home_latitude || !settings.home_longitude)) {
        Alert.alert(
          "⚠️ Home Location Not Set",
          "Please set your home location first before enabling geofence.",
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }

      const success = await toggleGeofence(value);
      if (success) {
        setSettings({ ...settings, geofence_enabled: value });
        Alert.alert(
          "Success",
          `Geofence ${value ? "enabled" : "disabled"}!`
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to toggle geofence");
    } finally {
      setLoading(false);
    }
  };

  // Update radius
  const handleUpdateRadius = async (newRadius: number) => {
    try {
      const userId = await Storage.getItem("userId");
      const token = await Storage.getItem("token");

      if (!userId || !token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/geofence/update-radius`,
        { userId: parseInt(userId), radiusMeters: newRadius },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSettings({ ...settings, radius_meters: newRadius });
      Alert.alert("✅ Success", `Geofence radius updated to ${newRadius}m`);
    } catch (error) {
      Alert.alert("Error", "Failed to update radius");
    }
  };

  // Haversine formula for distance calculation
  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.card}>
        <Text style={styles.title}>🏠 Geofence Settings</Text>

        {/* Geofence Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Enable Geofence</Text>
            <Switch
              value={settings.geofence_enabled}
              onValueChange={handleToggleGeofence}
              disabled={loading}
              trackColor={{ false: "#3e3e42", true: "#00d4ff" }}
              thumbColor={settings.geofence_enabled ? "#0a0a0f" : "#767676"}
            />
          </View>
          {settings.geofence_enabled && (
            <Text style={styles.description}>
              ✅ Geofence is active. All relays will turn off when you're{" "}
              {settings.radius_meters}m away.
            </Text>
          )}
          {!settings.geofence_enabled && (
            <Text style={styles.description}>
              ⏸️ Geofence is inactive. Enable to auto-disable relays when away.
            </Text>
          )}
        </View>

        {/* Home Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Home Location</Text>
          {settings?.home_latitude && settings?.home_longitude ? (
            <View style={styles.locationBox}>
              <Text style={styles.locationText}>
                ✅ Home set at: {Number(settings.home_latitude).toFixed(6)}, {Number(settings.home_longitude).toFixed(6)}
              </Text>
            </View>
          ) : (
            <View style={styles.locationBox}>
              <Text style={styles.locationText}>❌ Home location not set</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSetHomeLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a0a0f" />
            ) : (
              <Text style={styles.buttonText}>📍 Set Home Location</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Current Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGetCurrentLocation}
            disabled={loading}
          >
            {loading ? (
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
                📡 Accuracy: ±{currentLocation.accuracy ? Math.round(currentLocation.accuracy) : "N/A"}m
              </Text>
            </View>
          )}

          {distance !== null && (
            <View
              style={[
                styles.distanceBox,
                distance > settings.radius_meters && styles.distanceFar,
              ]}
            >
              <Text style={styles.distanceText}>
                Distance from home: {distance}m
              </Text>
              {distance > settings.radius_meters ? (
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

        {/* Radius Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geofence Radius</Text>
          <Text style={styles.radiusValue}>Current: {settings.radius_meters}m</Text>
          <View style={styles.radiusButtons}>
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() => handleUpdateRadius(250)}
            >
              <Text style={styles.radiusButtonText}>250m</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() => handleUpdateRadius(500)}
            >
              <Text style={styles.radiusButtonText}>500m</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() => handleUpdateRadius(1000)}
            >
              <Text style={styles.radiusButtonText}>1km</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 When geofence is enabled and you move {settings.radius_meters}+ meters away from your home location, all relays will automatically turn OFF for safety.
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
  },
  card: {
    backgroundColor: "#1a1a1f",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#00d4ff",
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
    backgroundColor: "#00d4ff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginVertical: 5,
    minWidth: 70,
  },
  radiusButtonText: {
    color: "#0a0a0f",
    fontWeight: "600",
    fontSize: 12,
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
