import React, { useState, useEffect } from 'react';
import styles from "../styles/bluePrint";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { BASE_URL } from '../utils/api';
import { Storage } from '../utils/storage';


const DraftCrosshair = ({ style }: { style: any }) => (
  <View style={[styles.crosshairContainer, style]}>
    <View style={styles.crosshairHorizontal} />
    <View style={styles.crosshairVertical} />
  </View>
);

const DoorSymbol = ({ style }: { style: any }) => (
  <View pointerEvents="none" style={[styles.doorSymbol, style]}>
    <Svg width={42} height={42} viewBox="0 0 42 42">
      <Path d="M4 4 A34 34 0 0 1 38 38" fill="none" stroke="#00ffff" strokeWidth={1.5} />
      <Path d="M38 4 V38" fill="none" stroke="#002240" strokeWidth={5} />
      <Path d="M38 4 H4" fill="none" stroke="#b9ffff" strokeWidth={2} />
      <Path d="M34 38 H42" fill="none" stroke="#00ffff" strokeWidth={1.5} />
    </Svg>
  </View>
);

const WindowSymbol = ({ style }: { style: any }) => (
  <View pointerEvents="none" style={[styles.windowSymbol, style]}>
    <Svg width={28} height={52} viewBox="0 0 28 52">
      <Path d="M14 0 V52" fill="none" stroke="#002240" strokeWidth={7} />
      <Path d="M9 3 V49 M19 3 V49" fill="none" stroke="#b9ffff" strokeWidth={1.5} />
      <Path d="M5 3 H23 M5 49 H23" fill="none" stroke="#00ffff" strokeWidth={1} />
    </Svg>
  </View>
);

function BluePrint() {
  const { isListening, startListening, stopListening } = useVoiceCommand();
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);

  const [relay1, setRelay1] = useState(false); // 1st Fl: Living Area
  const [relay2, setRelay2] = useState(false); // 1st Fl: Kitchen / Dining
  const [relay3, setRelay3] = useState(false); // 2nd Fl: Master Bedroom
  const [relay4, setRelay4] = useState(false); // 2nd Fl: Media Room
  const [relay5, setRelay5] = useState(false); // 2nd Fl: Home Office

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
      const token = await Storage.getItem('token');
      await axios.post(`${BASE_URL}/api/relay`, data, { headers: { Authorization: `Bearer ${token}` } });
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
      const token = await Storage.getItem('token');
      await axios.post(`${BASE_URL}/api/relay`, {
        [relayKey]: newValue,
      }, { headers: { Authorization: `Bearer ${token}` } });
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

  useEffect(() => {
    fetchRelay();
    const interval = setInterval(fetchRelay, 3000);
    return () => clearInterval(interval);
  }, []);

  const getGridStyle = () => {
    if (Platform.OS === 'web') {
      return {
        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 255, 0.1) 25%, rgba(0, 255, 255, 0.1) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.1) 75%, rgba(0, 255, 255, 0.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 255, 0.1) 25%, rgba(0, 255, 255, 0.1) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, 0.1) 75%, rgba(0, 255, 255, 0.1) 76%, transparent 77%, transparent)',
        backgroundSize: '30px 30px',
      } as any;
    }
    return {};
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.rootBackground}>
      <View style={styles.mainContainer}>
        
        {/* HEADER BLOCK */}
        <View style={styles.viewHeader}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.textHeader}>SCHEMATIC LAYOUT v5.0</Text>
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

        {/* VOICE COMMAND BUTTON */}
        <View style={styles.voiceCommandContainer}>
          {!isListening ? (
            <TouchableOpacity 
              style={styles.voiceBtn}
              onPress={startListening}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="mic-outline" 
                size={20} 
                color="#00ffff"
              />
              <Text style={styles.voiceBtnText}>
                🎤 VOICE COMMAND
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.listeningContainer}>
              <TouchableOpacity 
                style={styles.stopBtn}
                onPress={stopListening}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="mic" 
                  size={20} 
                  color="#ffffff"
                />
                <Text style={styles.stopBtnText}>
                  STOP LISTENING
                </Text>
              </TouchableOpacity>
              <View style={styles.listeningIndicator}>
                <Text style={styles.listeningText}>🔴 LISTENING...</Text>
              </View>
            </View>
          )}
          <Text style={styles.voiceHintText}>
            Say: "outlet1 on" or "relay 2 off"
          </Text>
        </View>

        {/* HIGH-REALISM BLUEPRINT FRAME */}
        <View style={styles.blueprintWrapper}>
          <View style={styles.houseFrame}>
            <View style={styles.gridOverlayLayer1} pointerEvents="none" />
            <View style={[styles.gridOverlayLayer2, getGridStyle()]} pointerEvents="none" />

            {/* FIXED: Scalable Vector-Style Corner Crosshair Marks */}
            <DraftCrosshair style={styles.tlMark} />
            <DraftCrosshair style={styles.trMark} />
            <DraftCrosshair style={styles.blMark} />
            <DraftCrosshair style={styles.brMark} />
            <View style={styles.northMarker} pointerEvents="none">
              <Text style={styles.northLetter}>N</Text>
              <Ionicons name="navigate" size={18} color="#00ffff" />
            </View>

            {/* DYNAMIC BLUEPRINT CONDITIONAL VIEWPORTS */}
            {activeFloor === 1 ? (
              /* ════════════════ FIRST FLOOR VIEWPORT ════════════════ */
              <View style={styles.viewportContainer}>
                <View style={styles.firstFloorRoomStack}>
                  {/* LIVING ROOM */}
                  <View style={[styles.firstFloorRoom, styles.borderRight, relay1 && styles.roomActive]}>
                    <DoorSymbol style={styles.doorAtRight} />
                    <WindowSymbol style={styles.windowAtLeft} />
                    <Text style={[styles.roomLabel, relay1 && styles.textCyan]}>LIVING AREA</Text>
                    <Text style={styles.dimensionText}>4.50m x 4.00m</Text>
                    <TouchableOpacity
                      style={[styles.powerBtn, relay1 && styles.powerBtnActive]}
                      onPress={() => toggleRelay("relay1", relay1, setRelay1)}
                      activeOpacity={0.9}
                    >
                      <Ionicons name={relay1 ? "checkmark-circle" : "ellipse-outline"} size={24} color={relay1 ? "#00ffaa" : "#5c8090"} />
                    </TouchableOpacity>
                    <Text style={[styles.relayTag, relay1 && styles.relayTagActive]}>[CH_01_RLY]</Text>
                  </View>

                  {/* KITCHEN / DINING */}
                  <View style={[styles.firstFloorRoom, relay2 && styles.roomActive]}>
                    <WindowSymbol style={styles.windowAtRight} />
                    <Text style={[styles.roomLabel, relay2 && styles.textCyan]}>KITCHEN / DINING</Text>
                    <Text style={styles.dimensionText}>3.20m x 4.00m</Text>
                    <TouchableOpacity
                      style={[styles.powerBtn, relay2 && styles.powerBtnActive]}
                      onPress={() => toggleRelay("relay2", relay2, setRelay2)}
                      activeOpacity={0.9}
                    >
                      <Ionicons name={relay2 ? "checkmark-circle" : "ellipse-outline"} size={24} color={relay2 ? "#00ffaa" : "#5c8090"} />
                    </TouchableOpacity>
                    <Text style={[styles.relayTag, relay2 && styles.relayTagActive]}>[CH_02_RLY]</Text>
                  </View>
                </View>

                <Text style={{ color: "#ffffff" }}>* GROUND ENTRY / PORCH BASE *</Text>
                <View style={styles.exteriorRowContainer}>
                  <View style={styles.exteriorMetaContainer}>
                    <Text style={styles.roomLabel}>GROUND FLOOR MAIN ENTRY</Text>
                  </View>
                  <Text style={styles.draftingNotes}>◀ ACCESS WAY</Text>
                </View>
              </View>
            ) : (
              /* ════════════════ SECOND FLOOR VIEWPORT ════════════════ */
              <View style={[styles.viewportContainer, styles.secondFloorViewport]}>
                <View style={[styles.interiorGridRow, styles.secondFloorInteriorGrid]}>
                  {/* MASTER BEDROOM */}
                  <View style={[styles.roomContainer, styles.borderRight, relay3 && styles.roomActive]}>
                    <DoorSymbol style={styles.doorAtRight} />
                    <WindowSymbol style={styles.windowAtLeft} />
                    <Text style={[styles.roomLabel, relay3 && styles.textCyan]}>MASTER BEDROOM</Text>
                    <Text style={styles.dimensionText}>5.10m x 3.80m</Text>
                    <TouchableOpacity
                      style={[styles.powerBtn, relay3 && styles.powerBtnActive]}
                      onPress={() => toggleRelay("relay3", relay3, setRelay3)}
                      activeOpacity={0.9}
                    >
                      <Ionicons name={relay3 ? "checkmark-circle" : "ellipse-outline"} size={24} color={relay3 ? "#00ffaa" : "#5c8090"} />
                    </TouchableOpacity>
                    <Text style={[styles.relayTag, relay3 && styles.relayTagActive]}>[CH_03_RLY]</Text>
                  </View>

                  {/* MEDIA ROOM */}
                  <View style={[styles.roomContainer, relay4 && styles.roomActive]}>
                    <WindowSymbol style={styles.windowAtRight} />
                    <Text style={[styles.roomLabel, relay4 && styles.textCyan]}>GARAGE</Text>
                    <Text style={styles.dimensionText}>2.10m x 2.20m</Text>
                    <TouchableOpacity
                      style={[styles.powerBtn, relay4 && styles.powerBtnActive]}
                      onPress={() => toggleRelay("relay4", relay4, setRelay4)}
                      activeOpacity={0.9}
                    >
                      <Ionicons name={relay4 ? "checkmark-circle" : "ellipse-outline"} size={24} color={relay4 ? "#00ffaa" : "#5c8090"} />
                    </TouchableOpacity>
                    <Text style={[styles.relayTag, relay4 && styles.relayTagActive]}>[CH_04_RLY]</Text>
                  </View>
                </View>

                {/* HOME OFFICE */}
                <View style={[styles.exteriorRowContainer, styles.secondFloorExterior, relay5 && styles.roomActive]}>
                  <DoorSymbol style={styles.doorAtLeft} />
                  <WindowSymbol style={styles.windowAtRight} />
                  <View style={styles.exteriorMetaContainer}>
                    <Text style={[styles.roomLabel, relay5 && styles.textCyan]}>HOME OFFICE</Text>
                    <Text style={styles.dimensionText}>7.70m x 1.50m</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.powerBtn, relay5 && styles.powerBtnActive]}
                    onPress={() => toggleRelay("relay5", relay5, setRelay5)}
                    activeOpacity={0.9}
                  >
                    <Ionicons name={relay5 ? "checkmark-circle" : "ellipse-outline"} size={24} color={relay5 ? "#00ffaa" : "#5c8090"} />
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
            <View style={styles.scaleLegend} pointerEvents="none">
              <Text style={styles.scaleLegendText}>KEY  ⌒ DOOR  ║ WINDOW</Text>
            </View>

          </View>
        </View>

      </View>
    </ScrollView>
  );
}

;

export default BluePrint;
