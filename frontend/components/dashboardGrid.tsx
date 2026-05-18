import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
} from "react-native";
import axios from "axios";

// Ensure this IP matches your computer's local IP address
const BASE_URL = "http://192.168.137.1:8000";

type Reading = {
  outlet_id: number;
  voltage: number;
  current: number;
  power: number;
  energy_kwh: number;
  hourly_used_kwh: number;
  frequency: number;
  pf: number;
};

export default function DashboardGrid() {
  const [relay1, setRelay1] = useState(false);
  const [relay2, setRelay2] = useState(false);
  const [relay3, setRelay3] = useState(false);
  const [ratePerKwh, setRatePerKwh] = useState("12");
  const [readings, setReadings] = useState<Reading[]>([]);
  const lastResetDate = useRef<string>(new Date().toDateString());

  const checkDailyReset = () => {
    const today = new Date().toDateString();
    if (lastResetDate.current !== today) {
      setReadings([]);
      lastResetDate.current = today;
    }
  };

  const fetchRelay = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/relay`, { timeout: 5000 });
      const relayData = res.data.data;
      if (relayData) {
        setRelay1(!!relayData.relay1);
        setRelay2(!!relayData.relay2);
        setRelay3(!!relayData.relay3);
      }
    } catch (error: any) {
      console.log("Relay Fetch Error:", error.message);
    }
  };

  const updateRelay = async (newData: any) => {
    try {
      await axios.post(`${BASE_URL}/api/relay`, newData);
      fetchRelay();
    } catch (error: any) {
      console.log("Relay Update Error:", error.message);
    }
  };

const fetchEnergy = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/pzem/latest`, { timeout: 5000 }); // 👈 add /latest
    if (Array.isArray(res.data)) {
      setReadings(res.data);
    }
  } catch (error: any) {
    console.log("Energy Fetch Error:", error.message);
  }
};

  useEffect(() => {
    checkDailyReset();
    fetchRelay();
    fetchEnergy();

    const interval = setInterval(() => {
      checkDailyReset();
      fetchRelay();
      fetchEnergy();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getOutlet = (id: number) => readings.find((r) => r.outlet_id === id);

  const totalKwh = readings.reduce((s, r) => s + (r.hourly_used_kwh || 0), 0);
  const totalPower = readings.reduce((sum, r) => sum + (r.power || 0), 0);
  const currentRate = parseFloat(ratePerKwh || "0");

  return (

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.viewHeader}>
          <Text style={styles.textHeader}>Energy Monitoring Dashboard</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Enter Rate (₱ per kWh)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={ratePerKwh}
            onChangeText={setRatePerKwh}
            placeholder="12"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.grid}>
          <View style={[styles.card, { borderLeftColor: "#ff6b6b" }]}>
            <Text style={styles.label}>Total Power</Text>
            <Text style={styles.value}>{totalPower.toFixed(2)} W</Text>
          </View>

          <View style={[styles.card, { borderLeftColor: "#4ecdc4" }]}>
            <Text style={styles.label}>Today's Energy</Text>
            <Text style={styles.value}>{totalKwh.toFixed(2)} kWh</Text>
          </View>

          <View style={[styles.card, { borderLeftColor: "#ffd93d" }]}>
            <Text style={styles.label}>Total Cost</Text>
            <Text style={styles.value}>₱{(totalKwh * currentRate).toFixed(2)}</Text>
          </View>

          <View style={[styles.card, { borderLeftColor: "#6bcb77" }]}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.statusText}>Live Monitoring</Text>
          </View>
        </View>

        <View style={[styles.grid, { marginTop: 20 }]}>
          {[
            { id: 1, state: relay1, setter: (val: boolean) => updateRelay({ relay1: val }), color: "#6bcb77" },
            { id: 2, state: relay2, setter: (val: boolean) => updateRelay({ relay2: val }), color: "#ff6b6b" },
            { id: 3, state: relay3, setter: (val: boolean) => updateRelay({ relay3: val }), color: "#4ecdc4" },
          ].map((item) => {
            const r = getOutlet(item.id);
            return (
              <View key={item.id} style={[styles.relayCard, { borderLeftColor: item.color }]}>
                <Text style={styles.label}>Relay {item.id}</Text>
                <Text style={styles.relayValue}>Power: {r ? `${r.power} W` : "--"}</Text>
                <Text style={styles.relayValue}>Energy: {r ? `${r.hourly_used_kwh} kWh` : "--"}</Text>
                <Text style={styles.relayValue}>Cost: ₱{r ? (r.hourly_used_kwh * currentRate).toFixed(2) : "--"}</Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => item.setter(!item.state)}
                >
                  <Text style={styles.buttonText}>{item.state ? "ON" : "OFF"}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, },
  scrollContent: { paddingBottom: 30 },
  viewHeader: { alignItems: "center", padding: 20 },
  textHeader: { fontSize: 22, color: "#fff", fontWeight: "bold" },
  inputContainer: { alignItems: "center", marginBottom: 20 },
  inputLabel: { color: "#a0a0b0", marginBottom: 8 },
  input: {
    backgroundColor: "#16213e",
    borderWidth: 1,
    borderColor: "#30475e",
    padding: 10,
    width: 140,
    borderRadius: 8,
    color: "#fff",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 15,
    width: "45%",
    height: 110,
    borderLeftWidth: 5,
    justifyContent: "center",
  },
  relayCard: {
    padding: 12,
    width: "30%",
    backgroundColor: "#16213e",
    borderRadius: 12,
    borderLeftWidth: 5,
    minHeight: 160,
  },
  label: { fontSize: 12, color: "#a0a0b0", marginBottom: 4 },
  value: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  statusText: { fontSize: 14, color: "#6bcb77", fontWeight: "600" },
  relayValue: { fontSize: 10, color: "#e0e0e0", marginTop: 4 },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: "auto",
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 12 },
});