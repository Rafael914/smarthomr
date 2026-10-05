import React, { useState, useEffect } from "react";
import styles from "../styles/dashboardGrid";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";
import { Platform } from "react-native";
import { BASE_URL } from "../utils/api";
import { Storage } from "../utils/storage";
import {fetchRelay} from "../axiosFolder/relay";
import {fetchPzem} from "../axiosFolder/pzem";
import { fetchEnergyBudget, saveEnergyBudget } from "../axiosFolder/energyBudget";


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

const budgetRelayKeys = ["relay1", "relay2", "relay3", "relay4", "relay5"];

export default function DashboardGrid() {



  const [schedules, setSchedules] = useState<Schedules>({
    relay1: { onTime: "", offTime: "", enabled: false },
    relay2: { onTime: "", offTime: "", enabled: false },
    relay3: { onTime: "", offTime: "", enabled: false },
    relay4: { onTime: "", offTime: "", enabled: false },
    relay5: { onTime: "", offTime: "", enabled: false },
  });

  const [pzemReadings, setPzemReadings] = useState<PzemReading[]>([]);
  const [pzemError, setPzemError] = useState(false);
  const [ratePerKwh, setRatePerKwh] = useState("");
  const [relayLimits, setRelayLimits] = useState<Record<string, string>>(
    Object.fromEntries(budgetRelayKeys.map((key) => [key, ""])),
  );
  const [relayCosts, setRelayCosts] = useState<Record<string, number>>({});
  const [budgetSaving, setBudgetSaving] = useState(false);

  const loadPzem = async () => {
  const data = await fetchPzem();

  setPzemReadings(data.readings);
  setPzemError(data.error);
}

useEffect(() => {
  loadPzem();
}, []);

  useEffect(() => {
    fetchEnergyBudget()
      .then((budget) => {
        setRatePerKwh(String(budget.ratePerKwh || ""));
        setRelayLimits(
          Object.fromEntries(
            budgetRelayKeys.map((key) => [key, budget.limits[key] ? String(budget.limits[key]) : ""]),
          ),
        );
        setRelayCosts(budget.costs || {});
      })
      .catch((error) => console.log("Energy budget fetch error:", error.message));
  }, []);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRelay, setSelectedRelay] = useState<string | null>(null);
  const [inputOn, setInputOn] = useState("");
  const [inputOff, setInputOff] = useState("");

  const [relayStates, setRelayStates] = useState({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
    relay5: false,
  });



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

  const saveBudget = async (resetCosts = false) => {
    const rate = Number(ratePerKwh);
    const limits = Object.fromEntries(
      budgetRelayKeys.map((key) => [key, Number(relayLimits[key] || 0)]),
    );

    if (!Number.isFinite(rate) || rate < 0 || Object.values(limits).some((limit) => !Number.isFinite(limit) || limit < 0)) {
      const message = "Enter non-negative numbers for the rate and relay limits.";
      if (Platform.OS === "web") alert(message);
      else Alert.alert("Validation Error", message);
      return;
    }

    setBudgetSaving(true);
    try {
      const budget = await saveEnergyBudget(rate, limits, resetCosts);
      setRelayCosts(budget.costs || {});
      if (resetCosts) {
        const message = "Relay cost counters were reset.";
        if (Platform.OS === "web") alert(message);
        else Alert.alert("Budget", message);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Unable to save the energy budget.";
      if (Platform.OS === "web") alert(message);
      else Alert.alert("Budget Error", message);
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleLogout = async () => {
    await Storage.removeItem("token");
    await Storage.removeItem("userId");
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

        {/*  Section Title: Energy Monitoring  */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ Power Telemetry</Text>
          <Text style={styles.sectionSub}>Live metrics from individual PZEM modules</Text>
        </View>

        {/*  Summary Cards Block  */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Combined Load</Text>
            <Text style={styles.summaryValue}>{totalPower.toFixed(1)}<Text style={styles.summaryUnit}> W</Text></Text>
          </View>

          <View style={{ backgroundColor: "#172033", borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
              Energy Cost Limits
            </Text>
            <Text style={{ color: "#9ca3af", marginBottom: 12 }}>
              Set your electricity rate in pesos per kWh. A relay turns off automatically when its limit is reached.
            </Text>

            <Text style={{ color: "#d1d5db", marginBottom: 5 }}>Rate (PHP per kWh)</Text>
            <TextInput
              value={ratePerKwh}
              onChangeText={setRatePerKwh}
              placeholder="e.g. 12.50"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              style={{ backgroundColor: "#1f2937", color: "#fff", borderRadius: 8, padding: 10, marginBottom: 10 }}
            />

            {RELAY_CONFIG.map((relay) => (
              <View key={relay.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ color: "#d1d5db", flex: 1 }}>{relay.label} limit (PHP)</Text>
                <TextInput
                  value={relayLimits[relay.id]}
                  onChangeText={(value) => setRelayLimits((previous) => ({ ...previous, [relay.id]: value }))}
                  placeholder="0 = off"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  style={{ width: 100, backgroundColor: "#1f2937", color: "#fff", borderRadius: 8, padding: 8 }}
                />
                <Text style={{ color: "#9ca3af", width: 90, textAlign: "right" }}>
                  PHP {(relayCosts[relay.id] || 0).toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              <TouchableOpacity
                onPress={() => saveBudget(false)}
                disabled={budgetSaving}
                style={{ backgroundColor: "#16a34a", borderRadius: 8, padding: 11, flex: 1 }}
              >
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
                  {budgetSaving ? "Saving..." : "Save Limits"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => saveBudget(true)}
                disabled={budgetSaving}
                style={{ backgroundColor: "#374151", borderRadius: 8, padding: 11, flex: 1 }}
              >
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>Reset Costs</Text>
              </TouchableOpacity>
            </View>
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

;
