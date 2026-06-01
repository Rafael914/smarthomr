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
import { Ionicons } from '@expo/vector-icons';

const BASE_URL = "http://192.168.137.1:8000";

function BluePrint() {

  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);


  const [relay1, setRelay1] = useState(false); // 1st Fl: Living Area
  const [relay2, setRelay2] = useState(false); // 1st Fl: Kitchen / Dining
  const [relay3, setRelay3] = useState(false); // 2nd Fl: Master Bedroom
  const [relay4, setRelay4] = useState(false); // 2nd Fl: Bathroom
  const [relay5, setRelay5] = useState(false); // 2nd Fl: Suspended Balcony

  const fetchRelay = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/relay`);
      const relayData = res.data;
      if (relayData) {
        setRelay1(!!relayData.relay1);
        setRelay2(!!relayData.relay2);
        setRelay3(!!relayData.relay3);
        setRelay4(!!relayData.relay4);
        setRelay5(!!relayData.relay5);
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
    setRelay5(true);
    updateRelay({ relay1: true, relay2: true, relay3: true, relay4: true, relay5: true });
  };

  const allOff = () => {
    setRelay1(false);
    setRelay2(false);
    setRelay3(false);
    setRelay4(false);
    setRelay5(false);
    updateRelay({ relay1: false, relay2: false, relay3: false, relay4: false, relay5: false });
  };

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
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.rootBackground}>
      <View style={styles.mainContainer}>
        
        {/* HEADER BLOCK */}
        <View style={styles.viewHeader}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.textHeader}>SCHEMATIC LAYOUT v5.0</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={16} color="#e74c3c" />
              <Text style={styles.logoutText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.textSubHeader}>MULTI-LEVEL ELECTRICAL MATRIX</Text>
        </View>

        {/* INTERACTIVE ARCHITECTURAL FLOOR NAV TABS */}
        <View style={styles.floorTabRow}>
          <TouchableOpacity 
            style={[styles.floorTab, activeFloor === 1 && styles.floorTabActive]} 
            onPress={() => setActiveFloor(1)}
          >
            <Text style={[styles.floorTabText, activeFloor === 1 && styles.floorTabTextActive]}>
              1ST FLOOR PLAN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.floorTab, activeFloor === 2 && styles.floorTabActive]} 
            onPress={() => setActiveFloor(2)}
          >
            <Text style={[styles.floorTabText, activeFloor === 2 && styles.floorTabTextActive]}>
              2ND FLOOR PLAN
            </Text>
          </TouchableOpacity>
        </View>

        {/* MASTER CONTROL BUTTONS */}
        <View style={styles.allBtnRow}>
          <TouchableOpacity style={styles.allOnBtn} onPress={allOn} activeOpacity={0.8}>
            <Text style={styles.allOnText}>🗲 BUS ENERGIZE (ALL ON)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.allOffBtn} onPress={allOff} activeOpacity={0.8}>
            <Text style={styles.allOffText}>🗴 BUS ISOLATE (ALL OFF)</Text>
          </TouchableOpacity>
        </View>

        {/* HIGH-REALISM BLUEPRINT FRAME */}
        <View style={styles.blueprintWrapper}>
          <View style={styles.houseFrame}>
            <View style={styles.gridOverlayLayer1} pointerEvents="none" />
            <View style={styles.gridOverlayLayer2} pointerEvents="none" />

            {/* Corner Draft Marks */}
            <Text style={[styles.draftMark, styles.tlMark]}>＋</Text>
            <Text style={[styles.draftMark, styles.trMark]}>＋</Text>
            <Text style={[styles.draftMark, styles.blMark]}>＋</Text>
            <Text style={[styles.draftMark, styles.brMark]}>＋</Text>

            {/* DYNAMIC BLUEPRINT CONDITIONAL VIEWPORTS */}
            {activeFloor === 1 ? (
              /* ════════════════ FIRST FLOOR VIEWPORT ════════════════ */
              <View style={styles.viewportContainer}>
                <View style={styles.interiorGridRow}>
                  {/* LIVING ROOM */}
                  <View style={[styles.roomContainer, styles.borderRight, relay1 && styles.roomActive]}>
                    <Text style={[styles.roomLabel, relay1 && styles.textCyan]}>LIVING AREA</Text>
                    <Text style={styles.dimensionText}>4.50m x 4.00m</Text>
                    <TouchableOpacity
                      style={[styles.powerBtn, relay1 && styles.powerBtnActive]}
                      onPress={() => toggleRelay("relay1", relay1, setRelay1)}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="radio-button-off-outline" size={24} color={relay1 ? "#ffffff" : "#00ffff"} />
                    </TouchableOpacity>
                    <Text style={[styles.relayTag, relay1 && styles.relayTagActive]}>[CH_01_RLY]</Text>
                  </View>

                  {/* KITCHEN / DINING */}
                  <View style={[styles.roomContainer, relay2 && styles.roomActive]}>
                    <Text style={[styles.roomLabel, relay2 && styles.textCyan]}>KITCHEN / DI</Text>
                    <Text style={styles.dimensionText}>3.20m x 4.00m</Text>
                    <TouchableOpacity
                      style={[styles.powerBtn, relay2 && styles.powerBtnActive]}
                      onPress={() => toggleRelay("relay2", relay2, setRelay2)}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="radio-button-off-outline" size={24} color={relay2 ? "#ffffff" : "#00ffff"} />
                    </TouchableOpacity>
                    <Text style={[styles.relayTag, relay2 && styles.relayTagActive]}>[CH_02_RLY]</Text>
                  </View>
                </View>

                {/* GROUND ENTRY / PORCH BASE */}
                <View style={styles.exteriorRowContainer}>
                  <View style={styles.exteriorMetaContainer}>
                    <Text style={styles.roomLabel}>GROUND FLOOR MAIN ENTRY</Text>

                  </View>
                  <Text style={styles.draftingNotes}>◀ ACCESS WAY</Text>
                </View>
              </View>
            ) : (
              /* SECOND FLOOR VIEWPORT*/
              <View style={styles.viewportContainer}>
                <View style={styles.interiorGridRow}>
                  {/* MASTER BEDROOM */}
                  <View style={[styles.roomContainer, styles.borderRight, relay3 && styles.roomActive]}>
                    <Text style={[styles.roomLabel, relay3 && styles.textCyan]}>MASTER BEDROOM</Text>
                    <Text style={styles.dimensionText}>5.10m x 3.80m</Text>
                    <TouchableOpacity
                      style={[styles.powerBtn, relay3 && styles.powerBtnActive]}
                      onPress={() => toggleRelay("relay3", relay3, setRelay3)}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="radio-button-off-outline" size={24} color={relay3 ? "#ffffff" : "#00ffff"} />
                    </TouchableOpacity>
                    <Text style={[styles.relayTag, relay3 && styles.relayTagActive]}>[CH_03_RLY]</Text>
                  </View>

                  {/* BATHROOM */}
                  <View style={[styles.roomContainer, relay4 && styles.roomActive]}>
                    <Text style={[styles.roomLabel, relay4 && styles.textCyan]}>MEDIA ROOM</Text>
                    <Text style={styles.dimensionText}>2.10m x 2.20m</Text>
                    <TouchableOpacity
                      style={[styles.powerBtn, relay4 && styles.powerBtnActive]}
                      onPress={() => toggleRelay("relay4", relay4, setRelay4)}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="radio-button-off-outline" size={24} color={relay4 ? "#ffffff" : "#00ffff"} />
                    </TouchableOpacity>
                    <Text style={[styles.relayTag, relay4 && styles.relayTagActive]}>[CH_04_RLY]</Text>
                  </View>
                </View>

                {/* THE ACTUAL SUSPENDED BALCONY */}
                <View style={[styles.exteriorRowContainer, relay5 && styles.roomActive]}>
                  <View style={styles.exteriorMetaContainer}>
                    <Text style={[styles.roomLabel, relay5 && styles.textCyan]}>FRONT BALCONY</Text>
                    <Text style={styles.dimensionText}>7.70m x 1.50m [VOID OPEN TO BELOW]</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.powerBtn, relay5 && styles.powerBtnActive]}
                    onPress={() => toggleRelay("relay5", relay5, setRelay5)}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="radio-button-off-outline" size={24} color={relay5 ? "#ffffff" : "#00ffff"} />
                  </TouchableOpacity>
                  <Text style={[styles.relayTag, relay5 && styles.relayTagActive]}>[CH_05_RLY]</Text>
                </View>
              </View>
            )}


            <View style={styles.technicalTitleBlock}>
              <Text style={styles.titleBlockBoldText}>VOLTGUARD CORP.</Text>
              <Text style={styles.titleBlockText}>SHEET: {activeFloor === 1 ? "1ST FLOOR PLAN" : "2ND FLOOR PLAN"}</Text>
              <Text style={styles.titleBlockText}>SCALE: 1:50 METRIC</Text>
              <Text style={styles.titleBlockText}>DWG NO: VG-A02_REV1</Text>
            </View>

          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rootBackground: {
    backgroundColor: '#001424',
  },
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
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  textHeader: {
    fontSize: 20,
    color: '#00ffff',
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  textSubHeader: {
    fontSize: 11,
    color: '#00a3a3',
    marginTop: 6,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e74c3c',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#00ffff0d',
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // ── Structural Selector Tabs ──
  floorTabRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00ffff22',
    borderRadius: 4,
    backgroundColor: '#001b33',
    overflow: 'hidden',
  },
  floorTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  floorTabActive: {
    backgroundColor: '#00ffff1a',
    borderBottomWidth: 2,
    borderBottomColor: '#00ffff',
  },
  floorTabText: {
    color: '#00a3a3',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  floorTabTextActive: {
    color: '#00ffff',
  },

  allBtnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  allOnBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#00ffaa',
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#00ffaa11',
  },
  allOnText: {
    color: '#00ffaa',
    fontWeight: '700',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  allOffBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ff5555',
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ff555511',
  },
  allOffText: {
    color: '#ff5555',
    fontWeight: '700',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  blueprintWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  houseFrame: {
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: '#002240',
    borderWidth: 2,
    borderColor: '#00ffff',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  viewportContainer: {
    flex: 1,
  },
  gridOverlayLayer1: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    borderWidth: 1,
    borderColor: '#00ffff',
    borderStyle: 'dashed',
    margin: 10,
  },
  gridOverlayLayer2: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundImage: Platform.OS === 'web' 
      ? 'linear-gradient(0deg, transparent 24%, #00ffff 25%, #00ffff 26%, transparent 27%, transparent 74%, #00ffff 75%, #00ffff 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #00ffff 25%, #00ffff 26%, transparent 27%, transparent 74%, #00ffff 75%, #00ffff 76%, transparent 77%, transparent)'
      : undefined,
    backgroundSize: Platform.OS === 'web' ? '30px 30px' : undefined,
  },
  draftMark: {
    position: 'absolute',
    color: '#00ffff44',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tlMark: { top: 4, left: 6 },
  trMark: { top: 4, right: 6 },
  blMark: { bottom: 4, left: 6 },
  brMark: { bottom: 4, right: 6 },

  interiorGridRow: {
    flex: 3.8,
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#00ffff',
  },
  exteriorRowContainer: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#00294d',
  },
  borderRight: {
    borderRightWidth: 2,
    borderRightColor: '#00ffff',
  },
  roomContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#002240',
  },
  roomActive: {
    backgroundColor: '#003b66',
  },
  roomLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dimensionText: {
    color: '#00a3a3',
    fontSize: 9,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  draftingNotes: {
    color: '#00a3a355',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  relayTag: {
    color: '#00a3a399',
    fontSize: 9,
    marginTop: 8,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  relayTagActive: {
    color: '#00ffff',
  },
  textCyan: {
    color: '#00ffff',
  },
  powerBtn: {
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00ffff66',
    backgroundColor: '#001b33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerBtnActive: {
    borderColor: '#ffffff',
    backgroundColor: '#0088cc',
  },
  exteriorMetaContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },

  // Metadata block changing labels based on state
  technicalTitleBlock: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    borderWidth: 1,
    borderColor: '#00ffff88',
    backgroundColor: '#001b33e5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: 150,
    borderRadius: 2,
  },
  titleBlockBoldText: {
    color: '#00ffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  titleBlockText: {
    color: '#00a3a3',
    fontSize: 7,
    fontWeight: '500',
    lineHeight: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default BluePrint;