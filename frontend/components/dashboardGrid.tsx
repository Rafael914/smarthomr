import React, { useState, useEffect } from "react";
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Platform } from "react-native";

const BASE_URL = "http://192.168.1.64:8000";

const RELAY_CONFIG = [
  { id: "relay1", label: "Outlet 1", icon: "🔌" },
  { id: "relay2", label: "Outlet 2", icon: "⚡" },
  { id: "relay3", label: "Outlet 3", icon: "💡" },
];

type Schedule = {
  onTime: string;   // "HH:MM"
  offTime: string;  // "HH:MM"
  enabled: boolean;
};

type Schedules = {
  relay1: Schedule;
  relay2: Schedule;
  relay3: Schedule;
};

export default function DashboardGrid() {
  const [relayStates, setRelayStates] = useState({
    relay1: false,
    relay2: false,
    relay3: false,
  });

  const [schedules, setSchedules] = useState<Schedules>({
    relay1: { onTime: "", offTime: "", enabled: false },
    relay2: { onTime: "", offTime: "", enabled: false },
    relay3: { onTime: "", offTime: "", enabled: false },
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRelay, setSelectedRelay] = useState<string | null>(null);
  const [inputOn, setInputOn] = useState("");
  const [inputOff, setInputOff] = useState("");

  const fetchRelay = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/relay`, { timeout: 5000 });
      const data = res.data;
      if (data) {
        setRelayStates({
          relay1: !!data.relay1,
          relay2: !!data.relay2,
          relay3: !!data.relay3,
        });
      }
    } catch (error: any) {
      console.log("Relay Fetch Error:", error.message);
    }
  };

  const toggleRelay = async (key: string, current: boolean) => {
    setRelayStates((prev) => ({ ...prev, [key]: !current }));
    try {
      await axios.post(`${BASE_URL}/api/relay`, { [key]: !current });
    } catch (error: any) {
      setRelayStates((prev) => ({ ...prev, [key]: current }));
      console.log("Relay Update Error:", error.message);
    }
  };

  const checkSchedules = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    (Object.keys(schedules) as Array<keyof Schedules>).forEach((key) => {
      const sched = schedules[key];
      if (!sched.enabled) return;

      if (sched.onTime && currentTime === sched.onTime) {
        axios.post(`${BASE_URL}/api/relay`, { [key]: true }).then(fetchRelay);
      }
      if (sched.offTime && currentTime === sched.offTime) {
        axios.post(`${BASE_URL}/api/relay`, { [key]: false }).then(fetchRelay);
      }
    });
  };

  useEffect(() => {
    fetchRelay();
    const relayInterval = setInterval(fetchRelay, 3000);
    const schedInterval = setInterval(checkSchedules, 30000);
    return () => {
      clearInterval(relayInterval);
      clearInterval(schedInterval);
    };
  }, [schedules]);

  const openModal = (relayId: string) => {
    const sched = schedules[relayId as keyof Schedules];
    setSelectedRelay(relayId);
    setInputOn(sched.onTime);
    setInputOff(sched.offTime);
    setModalVisible(true);
  };

  const saveSchedule = () => {
    if (!selectedRelay) return;

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (inputOn && !timeRegex.test(inputOn)) {
      alert("Invalid ON time format. Use HH:MM (e.g. 08:00)");
      return;
    }
    if (inputOff && !timeRegex.test(inputOff)) {
      alert("Invalid OFF time format. Use HH:MM (e.g. 22:00)");
      return;
    }

    setSchedules((prev) => ({
      ...prev,
      [selectedRelay]: {
        onTime: inputOn,
        offTime: inputOff,
        enabled: !!(inputOn || inputOff),
      },
    }));
    setModalVisible(false);
  };

  const clearSchedule = () => {
    if (!selectedRelay) return;
    setSchedules((prev) => ({
      ...prev,
      [selectedRelay]: { onTime: "", offTime: "", enabled: false },
    }));
    setInputOn("");
    setInputOff("");
    setModalVisible(false);
  };

const handleLogout = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem("token");
  } else {
    await SecureStore.deleteItemAsync("token");
  }
  router.replace("/auth/login");
};
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* ── Header with Logout ── */}
<View style={styles.header}>
  <View style={styles.headerTextGroup}>
    <Text style={styles.headerTitle}>Relay Control</Text>
    <Text style={styles.headerSub}>Manage your 3 outlet relays</Text>
  </View>
  <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
    <Text style={styles.logoutBtnText}>⏻  Logout</Text>
  </TouchableOpacity>
</View>

      <View style={styles.grid}>
        {RELAY_CONFIG.map((relay) => {
          const isOn = relayStates[relay.id as keyof typeof relayStates];
          const sched = schedules[relay.id as keyof Schedules];
          return (
            <View key={relay.id} style={[styles.card, isOn && styles.cardActive]}>
              <View style={styles.cardTop}>
                <Text style={styles.relayIcon}>{relay.icon}</Text>
                <View style={[styles.dot, isOn ? styles.dotOn : styles.dotOff]} />
              </View>

              <Text style={styles.relayLabel}>
                Relay {relay.id.replace("relay", "")}
              </Text>
              <Text style={styles.relayName}>{relay.label}</Text>

              {sched.enabled && (
                <View style={styles.schedBadgeRow}>
                  {sched.onTime ? (
                    <View style={styles.schedBadge}>
                      <Text style={styles.schedBadgeText}>🟢 ON {sched.onTime}</Text>
                    </View>
                  ) : null}
                  {sched.offTime ? (
                    <View style={[styles.schedBadge, styles.schedBadgeOff]}>
                      <Text style={styles.schedBadgeText}>🔴 OFF {sched.offTime}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.cardBottom}>
                <View style={[styles.badge, isOn ? styles.badgeOn : styles.badgeOff]}>
                  <Text style={[styles.badgeText, isOn ? styles.badgeTextOn : styles.badgeTextOff]}>
                    {isOn ? "ON" : "OFF"}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => toggleRelay(relay.id, isOn)}
                  style={[styles.switchTrack, isOn ? styles.switchTrackOn : styles.switchTrackOff]}
                >
                  <View style={[styles.switchThumb, isOn ? styles.switchThumbOn : styles.switchThumbOff]} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.schedBtn, sched.enabled && styles.schedBtnActive]}
                onPress={() => openModal(relay.id)}
              >
                <Text style={styles.schedBtnText}>
                  {sched.enabled ? "⏰ Scheduled" : "＋ Set Schedule"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* ── Schedule Modal ── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Set Schedule —{" "}
              {selectedRelay
                ? RELAY_CONFIG.find((r) => r.id === selectedRelay)?.label
                : ""}
            </Text>
            <Text style={styles.modalSub}>Format: HH:MM (24-hour)</Text>

            <Text style={styles.inputLabel}>Turn ON time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 08:00"
              placeholderTextColor="#555"
              value={inputOn}
              onChangeText={setInputOn}
              keyboardType="numeric"
              maxLength={5}
            />

            <Text style={styles.inputLabel}>Turn OFF time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 22:00"
              placeholderTextColor="#555"
              value={inputOff}
              onChangeText={setInputOff}
              keyboardType="numeric"
              maxLength={5}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearSchedule}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveSchedule}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },

  // ── Header ──
 header: {
  flexDirection: "column",          
  alignItems: "center",
  justifyContent: "center",

  marginTop: 20,
  marginBottom: 10,
},
  headerTextGroup: {
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "600", color: "#fff" },
  headerSub: { fontSize: 13, color: "#8888a0", marginTop: 4 },

  // ── Logout Button ──
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#e74c3c55",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1a0a0a",
    marginTop: 12,
  },
  logoutBtnText: {
    color: "#e74c3c",
    fontSize: 12,
    fontWeight: "700",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  card: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 18,
    width: "44%",
    borderWidth: 1,
    borderColor: "#2a2f4e",
    gap: 8,
  },
  cardActive: {
    borderColor: "#22c55e55",
    backgroundColor: "#0f2a1a",
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  relayIcon: { fontSize: 26 },

  dot: { width: 9, height: 9, borderRadius: 5 },
  dotOn: { backgroundColor: "#22c55e" },
  dotOff: { backgroundColor: "#374151" },

  relayLabel: {
    fontSize: 11,
    color: "#6b7280",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  relayName: { fontSize: 15, fontWeight: "600", color: "#fff" },

  schedBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  schedBadge: {
    backgroundColor: "#14532d",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  schedBadgeOff: { backgroundColor: "#3a1a1a" },
  schedBadgeText: { fontSize: 10, color: "#d1fae5" },

  divider: { height: 1, backgroundColor: "#2a2f4e", marginVertical: 4 },

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeOn: { backgroundColor: "#14532d" },
  badgeOff: { backgroundColor: "#1f2937" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeTextOn: { color: "#22c55e" },
  badgeTextOff: { color: "#6b7280" },

  switchTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  switchTrackOn: { backgroundColor: "#22c55e" },
  switchTrackOff: { backgroundColor: "#374151" },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  switchThumbOn: { alignSelf: "flex-end" },
  switchThumbOff: { alignSelf: "flex-start" },

  schedBtn: {
    borderWidth: 1,
    borderColor: "#2a2f4e",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
    marginTop: 4,
  },
  schedBtnActive: { borderColor: "#22c55e55", backgroundColor: "#0a2a18" },
  schedBtnText: { fontSize: 11, color: "#8888a0" },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    borderWidth: 1,
    borderColor: "#2a2f4e",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  modalSub: { fontSize: 11, color: "#6b7280", marginBottom: 16 },
  inputLabel: { fontSize: 12, color: "#a0a0b0", marginBottom: 6 },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#2a2f4e",
    borderRadius: 8,
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
  },
  modalBtnRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  clearBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e74c3c55",
    alignItems: "center",
  },
  clearBtnText: { color: "#e74c3c", fontWeight: "700", fontSize: 13 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2f4e",
    alignItems: "center",
  },
  cancelBtnText: { color: "#6b7280", fontWeight: "700", fontSize: 13 },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#22c55e",
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
