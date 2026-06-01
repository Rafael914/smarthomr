import React, { useState, useEffect } from "react";
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Platform } from "react-native";

const BASE_URL = "http://192.168.137.1:8000"; 

// Expanded CONFIG to 5 channels
const RELAY_CONFIG = [
  { id: "relay1", label: "Living Area", icon: "🔌" },
  { id: "relay2", label: "Kitchen", icon: "⚡" },
  { id: "relay3", label: "Bedroom", icon: "💡" },
  { id: "relay4", label: "MEDIA ROOM", icon: "🖥️" },
  { id: "relay5", label: "Front Balcony", icon: "🌀" },
];

type Schedule = {
  onTime: string;   
  offTime: string;  
  enabled: boolean;
};

// Expanded Types to 5 channels
type Schedules = {
  relay1: Schedule;
  relay2: Schedule;
  relay3: Schedule;
  relay4: Schedule;
  relay5: Schedule;
};

type PzemReading = {
  outlet_id: number;
  outlet_name: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  pf: number;
};

export default function DashboardGrid() {
  // Expanded State Hooks to 5 channels
  const [relayStates, setRelayStates] = useState({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
    relay5: false,
  });

  const [schedules, setSchedules] = useState<Schedules>({
    relay1: { onTime: "", offTime: "", enabled: false },
    relay2: { onTime: "", offTime: "", enabled: false },
    relay3: { onTime: "", offTime: "", enabled: false },
    relay4: { onTime: "", offTime: "", enabled: false },
    relay5: { onTime: "", offTime: "", enabled: false },
  });

  const [pzemReadings, setPzemReadings] = useState<PzemReading[]>([]);
  const [pzemError, setPzemError] = useState(false);

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
          relay4: !!data.relay4,
          relay5: !!data.relay5,
        });
      }
    } catch (error: any) {
      console.log("Relay Fetch Error:", error.message);
    }
  };

  const fetchPzem = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/pzem`, { timeout: 5000 });
      if (Array.isArray(res.data)) {
        setPzemReadings(res.data);
        setPzemError(false);
      }
    } catch (error: any) {
      console.log("PZEM Fetch Error:", error.message);
      setPzemError(true);
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
    fetchPzem();
    const relayInterval = setInterval(fetchRelay, 3000);
    const pzemInterval = setInterval(fetchPzem, 2000);
    const schedInterval = setInterval(checkSchedules, 30000);
    return () => {
      clearInterval(relayInterval);
      clearInterval(pzemInterval);
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
      if (Platform.OS === 'web') alert("Invalid ON time format. Use HH:MM (e.g. 08:00)");
      else Alert.alert("Validation Error", "Invalid ON time format. Use HH:MM (e.g. 08:00)");
      return;
    }
    if (inputOff && !timeRegex.test(inputOff)) {
      if (Platform.OS === 'web') alert("Invalid OFF time format. Use HH:MM (e.g. 22:00)");
      else Alert.alert("Validation Error", "Invalid OFF time format. Use HH:MM (e.g. 22:00)");
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

  const totalPower = pzemError ? 0 : pzemReadings.reduce((sum, r) => sum + (r.power || 0), 0);
  const totalEnergy = pzemError ? 0 : pzemReadings.reduce((sum, r) => sum + (r.energy || 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.rootScrollView}>
      <View style={styles.mainContainer}>
        
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>VoltGuard Smart Hub</Text>
            <Text style={styles.headerSub}>Real-Time Monitoring & Relay Controls</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>⏻  Logout</Text>
          </TouchableOpacity>
        </View>

        {/* ── Relay Control Switches Grid ── */}
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

                <Text style={styles.relayLabel}>Relay {relay.id.replace("relay", "")}</Text>
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
                    style={[
                      styles.switchTrack, 
                      isOn ? styles.switchTrackOn : styles.switchTrackOff,
                      isOn ? styles.trackAlignOn : styles.trackAlignOff
                    ]}
                  >
                    <View style={styles.switchThumb} />
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

        {/* ── Section Title: Energy Monitoring ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ Power Telemetry</Text>
          <Text style={styles.sectionSub}>Live metrics from individual PZEM modules</Text>
        </View>

        {/* ── Summary Cards Block ── */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Combined Load</Text>
            <Text style={styles.summaryValue}>{totalPower.toFixed(1)}<Text style={styles.summaryUnit}> W</Text></Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Aggregated Total</Text>
            <Text style={styles.summaryValue}>{totalEnergy.toFixed(3)}<Text style={styles.summaryUnit}> kWh</Text></Text>
          </View>
        </View>

        {/* ── 5x Real-Time PZEM Cards Grid (Dynamically follows RELAY_CONFIG array length) ── */}
        <View style={styles.pzemGrid}>
          {RELAY_CONFIG.map((config, index) => {
            const reading = (!pzemError && pzemReadings.find((r) => r.outlet_id === index + 1)) || {
              voltage: 0,
              current: 0,
              power: 0,
              frequency: 0,
              pf: 0,
              energy: 0,
            };

            const isOffline = pzemError || pzemReadings.length === 0;

            return (
              <View key={config.id} style={styles.pzemCard}>
                <View style={styles.pzemCardHeader}>
                  <Text style={styles.pzemOutletIcon}>{config.icon}</Text>
                  <View>
                    <Text style={styles.pzemOutletLabel}>Sensor Module 0{index + 1}</Text>
                    <Text style={styles.pzemOutletName}>{config.label}</Text>
                  </View>
                  <View style={[styles.liveDot, isOffline && styles.liveDotOffline]} />
                </View>

                <View style={styles.pzemDivider} />

                <View style={styles.pzemHeroRow}>
                  <View style={styles.pzemHeroBlock}>
                    <Text style={styles.pzemHeroLabel}>RMS Voltage</Text>
                    <View style={styles.pzemInlineUnit}>
                      <Text style={[styles.pzemVoltageValue, isOffline && styles.offlineText]}>
                        {reading.voltage.toFixed(1)}
                      </Text>
                      <Text style={[styles.pzemHeroUnit, isOffline && styles.offlineText]}> V</Text>
                    </View>
                  </View>
                  
                  <View style={styles.pzemHeroBlock}>
                    <Text style={styles.pzemHeroLabel}>Active Power</Text>
                    <View style={styles.pzemInlineUnit}>
                      <Text style={[styles.pzemVoltageValue, isOffline ? styles.offlineText : { color: "#facc15" }]}>
                        {reading.power.toFixed(1)}
                      </Text>
                      <Text style={[styles.pzemHeroUnit, isOffline ? styles.offlineText : { color: "#facc15" }]}> W</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.pzemStatsGrid}>
                  <View style={styles.pzemStatItem}>
                    <Text style={styles.pzemStatLabel}>Current</Text>
                    <Text style={[styles.pzemStatValue, isOffline && styles.offlineText]}>
                      {reading.current.toFixed(2)}
                      <Text style={styles.pzemStatUnit}> A</Text>
                    </Text>
                  </View>
                  <View style={styles.pzemStatItem}>
                    <Text style={styles.pzemStatLabel}>Frequency</Text>
                    <Text style={[styles.pzemStatValue, isOffline && styles.offlineText]}>
                      {reading.frequency.toFixed(1)}
                      <Text style={styles.pzemStatUnit}> Hz</Text>
                    </Text>
                  </View>
                  <View style={styles.pzemStatItem}>
                    <Text style={styles.pzemStatLabel}>Power Factor</Text>
                    <Text style={[styles.pzemStatValue, isOffline && styles.offlineText]}>
                      {reading.pf.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.pzemEnergyRow}>
                  <Text style={styles.pzemEnergyLabel}>Net Consumption</Text>
                  <Text style={[styles.pzemEnergyValue, isOffline && styles.offlineText]}>
                    {reading.energy.toFixed(3)} kWh
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

      </View>

      {/* ── Schedule Setup Modal ── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Set Schedule —{" "}
              {selectedRelay ? RELAY_CONFIG.find((r) => r.id === selectedRelay)?.label : ""}
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
  rootScrollView: {},
  scrollContent: { 
    paddingBottom: 40, 
    minHeight: "100%",
    alignItems: "center"
  },
  mainContainer: {
    width: "100%",
    maxWidth: 1024,
    paddingHorizontal: 16,
  },

  // ── Header UI ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
    marginBottom: 20,
    width: "100%",
  },
  headerTextGroup: { alignItems: "flex-start" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "#8888a0", marginTop: 4 },

  logoutBtn: {
    borderWidth: 1,
    borderColor: "#e74c3c55",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1a0a0a",
  },
  logoutBtnText: { color: "#e74c3c", fontSize: 12, fontWeight: "700" },

  // ── Switch Layout Components ──
  switchTrack: { 
    width: 50, 
    height: 28, 
    borderRadius: 14, 
    flexDirection: "row",   
    alignItems: "center",    
    paddingHorizontal: 3,
  },
  switchTrackOn: { backgroundColor: "#22c55e" },
  switchTrackOff: { backgroundColor: "#374151" },
  trackAlignOn: { justifyContent: "flex-end" },    
  trackAlignOff: { justifyContent: "flex-start" },  

  switchThumb: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    backgroundColor: "#fff" 
  },

  // ── Relay Smart Cards Layout ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    width: "100%",
  },
  card: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2a2f4e",
    gap: 8,
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 260,
  },
  cardActive: { borderColor: "#22c55e55", backgroundColor: "#0f2a1a" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  relayIcon: { fontSize: 26 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotOn: { backgroundColor: "#22c55e" },
  dotOff: { backgroundColor: "#374151" },
  relayLabel: { fontSize: 11, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 },
  relayName: { fontSize: 15, fontWeight: "600", color: "#fff" },
  schedBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  schedBadge: { backgroundColor: "#14532d", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  schedBadgeOff: { backgroundColor: "#3a1a1a" },
  schedBadgeText: { fontSize: 10, color: "#d1fae5" },
  divider: { height: 1, backgroundColor: "#2a2f4e", marginVertical: 4 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeOn: { backgroundColor: "#14532d" },
  badgeOff: { backgroundColor: "#1f2937" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeTextOn: { color: "#22c55e" },
  badgeTextOff: { color: "#6b7280" },
  schedBtn: { borderWidth: 1, borderColor: "#2a2f4e", borderRadius: 8, paddingVertical: 6, alignItems: "center", marginTop: 4 },
  schedBtnActive: { borderColor: "#22c55e55", backgroundColor: "#0a2a18" },
  schedBtnText: { fontSize: 11, color: "#8888a0" },

  // ── Telemetry Styling ──
  sectionHeader: { alignItems: "flex-start", marginTop: 36, marginBottom: 14, width: "100%" },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  sectionSub: { fontSize: 12, color: "#8888a0", marginTop: 2 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 16, width: "100%" },
  summaryCard: { 
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 260,
    backgroundColor: "#16213e", 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#2a2f4e", 
    padding: 16 
  },
  summaryLabel: { fontSize: 11, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: "700", color: "#facc15" },
  summaryUnit: { fontSize: 14, fontWeight: "400", color: "#8888a0" },

  pzemGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap",
    gap: 16, 
    width: "100%",
    marginBottom: 20,
  },
  pzemCard: { 
    backgroundColor: "#16213e", 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#2a2f4e", 
    padding: 16,
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 290, 
  },
  pzemCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  pzemOutletIcon: { fontSize: 22 },
  pzemOutletLabel: { fontSize: 10, color: "#6b7280", textTransform: "uppercase", fontWeight: "600" },
  pzemOutletName: { fontSize: 15, fontWeight: "600", color: "#fff" },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e", marginLeft: "auto" },
  liveDotOffline: { backgroundColor: "#374151" },
  pzemDivider: { height: 1, backgroundColor: "#2a2f4e", marginVertical: 12 },

  pzemHeroRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, gap: 12 },
  pzemHeroBlock: { flex: 1, backgroundColor: "#0f172a", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#2a2f4e" },
  pzemHeroLabel: { fontSize: 11, color: "#6b7280", marginBottom: 2 },
  pzemInlineUnit: { flexDirection: "row", alignItems: "baseline" },
  pzemVoltageValue: { fontSize: 22, fontWeight: "700", color: "#3b82f6" },
  pzemHeroUnit: { fontSize: 13, color: "#3b82f6", fontWeight: "600" },

  offlineText: { color: "#374151" },

  pzemStatsGrid: { flexDirection: "row", justifyContent: "space-between", gap: 6, marginBottom: 12 },
  pzemStatItem: { flex: 1, backgroundColor: "#0f172a", borderRadius: 8, padding: 6, borderWidth: 1, borderColor: "#2a2f4e", alignItems: "center" },
  pzemStatLabel: { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  pzemStatValue: { fontSize: 13, fontWeight: "600", color: "#f3f4f6" },
  pzemStatUnit: { fontSize: 9, color: "#6b7280" },

  pzemEnergyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#2a2f4e", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  pzemEnergyLabel: { fontSize: 11, color: "#a0a0b0", fontWeight: "500" },
  pzemEnergyValue: { fontSize: 13, fontWeight: "700", color: "#10b981" },

  // ── Modal Styles ──
  modalOverlay: { flex: 1, backgroundColor: "#000000aa", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#16213e", borderRadius: 16, padding: 24, width: "85%", maxWidth: 420, borderWidth: 1, borderColor: "#2a2f4e" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  modalSub: { fontSize: 11, color: "#6b7280", marginBottom: 16 },
  inputLabel: { fontSize: 12, color: "#a0a0b0", marginBottom: 6 },
  input: { backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#2a2f4e", borderRadius: 8, color: "#fff", paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 14 },
  modalBtnRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  clearBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#e74c3c55", alignItems: "center" },
  clearBtnText: { color: "#e74c3c", fontWeight: "700", fontSize: 13 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#2a2f4e", alignItems: "center" },
  cancelBtnText: { color: "#6b7280", fontWeight: "700", fontSize: 13 },
  saveBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: "#22c55e", alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});