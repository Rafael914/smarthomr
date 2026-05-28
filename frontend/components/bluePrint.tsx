import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Added for a clean dashboard icon feel

const BASE_URL = "http://192.168.1.64:8000";

function BluePrint() {
  const [relay1, setRelay1] = useState(false);
  const [relay2, setRelay2] = useState(false);
  const [relay3, setRelay3] = useState(false);
  const [relay4, setRelay4] = useState(false);

  const fetchRelay = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/relay`);
      const relayData = res.data;
      if (relayData) {
        setRelay1(!!relayData.relay1);
        setRelay2(!!relayData.relay2);
        setRelay3(!!relayData.relay3);
        setRelay4(!!relayData.relay4);
      }
    } catch (error) {
      console.error("fetchRelay error:", error);
    }
  };

  const updateRelay = async (data: any) => {
    try {
      await axios.post(`${BASE_URL}/api/relay`, data);
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const toggleRelay = async (
    relayKey: string,
    value: boolean,
    setState: (val: boolean) => void
  ) => {
    const newValue = !value;
    setState(newValue);
    try {
      await axios.post(`${BASE_URL}/api/relay`, {
        [relayKey]: newValue,
      });
    } catch (error) {
      console.error("Update error:", error);
      setState(value);
    }
  };

  const allOn = () => {
    setRelay1(true);
    setRelay2(true);
    setRelay3(true);
    setRelay4(true);
    updateRelay({ relay1: true, relay2: true, relay3: true, relay4: true });
  };

  const allOff = () => {
    setRelay1(false);
    setRelay2(false);
    setRelay3(false);
    setRelay4(false);
    updateRelay({ relay1: false, relay2: false, relay3: false, relay4: false });
  };

  // HANDLES SAFE MULTI-PLATFORM LOGOUT SESSION PURGING
  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        if (Platform.OS === 'web') {
          localStorage.removeItem('token');
        } else {
          await SecureStore.deleteItemAsync('token');
        }
        router.replace('/auth/login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        performLogout();
      }
    } else {
      Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  useEffect(() => {
    fetchRelay();
    const interval = setInterval(fetchRelay, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.mainContainer}>
        
        {/* HEADER BLOCK WITH LOGOUT POSITIONED ACCORDINGLY */}
        <View style={styles.viewHeader}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.textHeader}>House Blueprint</Text>
            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.textSubHeader}>Interactive Architectural Layout</Text>
        </View>

        {/* ALL BUTTONS */}
        <View style={styles.allBtnRow}>
          <TouchableOpacity style={styles.allOnBtn} onPress={allOn} activeOpacity={0.8}>
            <Text style={styles.allOnText}>💡 All ON</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.allOffBtn} onPress={allOff} activeOpacity={0.8}>
            <Text style={styles.allOffText}>🌑 All OFF</Text>
          </TouchableOpacity>
        </View>

        {/* COMPACT RESPONSIVE GRID WRAPPER */}
        <View style={styles.blueprintWrapper}>
          <View style={styles.fourBox}>

            {/* LEFT SIDE BLOCK */}
            <View style={styles.leftColumn}>
              {/* LIVING ROOM */}
              <View style={[styles.roomContainer, styles.borderBottom, relay1 && styles.roomActive]}>
                <Text style={styles.roomLabel}>Living Room</Text>
                <TouchableOpacity
                  style={[styles.powerBtn, relay1 && styles.powerBtnActive]}
                  onPress={() => toggleRelay("relay1", relay1, setRelay1)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.powerLine, relay1 && styles.powerIconActive]} />
                  <View style={[styles.powerCircle, relay1 && styles.powerCircleActive]} />
                </TouchableOpacity>
                <Text style={[styles.relayTag, relay1 && styles.relayTagActive]}>Relay 1</Text>
              </View>

              {/* KITCHEN */}
              <View style={[styles.roomContainer, relay2 && styles.roomActive]}>
                <Text style={styles.roomLabel}>Kitchen</Text>
                <TouchableOpacity
                  style={[styles.powerBtn, relay2 && styles.powerBtnActive]}
                  onPress={() => toggleRelay("relay2", relay2, setRelay2)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.powerLine, relay2 && styles.powerIconActive]} />
                  <View style={[styles.powerCircle, relay2 && styles.powerCircleActive]} />
                </TouchableOpacity>
                <Text style={[styles.relayTag, relay2 && styles.relayTagActive]}>Relay 2</Text>
              </View>
            </View>

            {/* RIGHT SIDE BLOCK */}
            <View style={styles.rightColumn}>
              {/* BEDROOM */}
              <View style={[styles.roomContainer, styles.bedroomFlex, styles.borderBottom, relay3 && styles.roomActive]}>
                <Text style={styles.roomLabel}>Bed Room</Text>
                <TouchableOpacity
                  style={[styles.powerBtn, relay3 && styles.powerBtnActive]}
                  onPress={() => toggleRelay("relay3", relay3, setRelay3)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.powerLine, relay3 && styles.powerIconActive]} />
                  <View style={[styles.powerCircle, relay3 && styles.powerCircleActive]} />
                </TouchableOpacity>
                <Text style={[styles.relayTag, relay3 && styles.relayTagActive]}>Relay 3</Text>
              </View>

              {/* BATHROOM */}
              <View style={[styles.roomContainer, relay4 && styles.roomActive]}>
                <Text style={styles.roomLabel}>Bathroom</Text>
                <TouchableOpacity
                  style={[styles.powerBtn, relay4 && styles.powerBtnActive]}
                  onPress={() => toggleRelay("relay4", relay4, setRelay4)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.powerLine, relay4 && styles.powerIconActive]} />
                  <View style={[styles.powerCircle, relay4 && styles.powerCircleActive]} />
                </TouchableOpacity>
                <Text style={[styles.relayTag, relay4 && styles.relayTagActive]}>Relay 4</Text>
              </View>
            </View>

          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 40,
    minHeight: "100%",
    alignItems: "center",
  },
  mainContainer: {
    width: "100%",
    maxWidth: 640,
    paddingHorizontal: 20,
  },
  viewHeader: {
    width: '100%',
    marginTop: 40,
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  textHeader: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  textSubHeader: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e74c3c44',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#e74c3c11',
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '600',
  },
  allBtnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
    width: '100%',
  },
  allOnBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#14532d33',
  },
  allOnText: {
    color: '#2ecc71',
    fontWeight: '700',
    fontSize: 13,
  },
  allOffBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#3a1a1a33',
  },
  allOffText: {
    color: '#e74c3c',
    fontWeight: '700',
    fontSize: 13,
  },
  blueprintWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  fourBox: {
    flexDirection: 'row',
    width: '100%',
    aspectRatio: 0.85, 
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#2a2f4e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  leftColumn: {
    flex: 1,
    borderRightWidth: 2,
    borderRightColor: '#2a2f4e',
  },
  rightColumn: {
    flex: 1,
  },
  roomContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#16213e33',
  },
  roomActive: {
    backgroundColor: '#14532d15', 
  },
  bedroomFlex: {
    flex: 1.4, 
  },
  borderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: '#2a2f4e',
  },
  roomLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  relayTag: {
    color: '#4b5563',
    fontSize: 10,
    marginTop: 8,
    fontWeight: '500',
  },
  relayTagActive: {
    color: '#2ecc71',
  },
  powerBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#4b5563',
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerBtnActive: {
    borderColor: '#2ecc71',
    backgroundColor: '#15803d',
  },
  powerLine: {
    position: 'absolute',
    top: 8,
    width: 3,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#4b5563',
  },
  powerIconActive: {
    backgroundColor: '#ffffff',
  },
  powerCircle: {
    position: 'absolute',
    bottom: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#4b5563',
  },
  powerCircleActive: {
    borderColor: '#ffffff',
  },
});

export default BluePrint;