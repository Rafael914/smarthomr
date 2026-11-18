import axios from "axios";
import { Storage } from "./storage";
import { BASE_URL } from "./api";

export async function checkLocationAndDisableRelays(latitude: number, longitude: number) {
  const [token, userId] = await Promise.all([
    Storage.getItem("token"),
    Storage.getItem("userId"),
  ]);
  if (!token || !userId) return false;

  const response = await axios.post(
    `${BASE_URL}/api/geofence/check-distance`,
    { userId: Number.parseInt(userId, 10), currentLatitude: latitude, currentLongitude: longitude },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.data.shouldDisableRelays) return false;

  await axios.post(
    `${BASE_URL}/api/relay`,
    { relay1: false, relay2: false, relay3: false, relay4: false, relay5: false },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  console.log("Geofence exit detected: all relays switched off");
  return true;
}
