import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import axios from 'axios';


const BASE_URL = "http://192.168.137.1:8000";

function BluePrint() {

  const [relay1, setRelay1] = useState(false);
  const [relay2, setRelay2] = useState(false);
  const [relay3, setRelay3] = useState(false);
  const [relay4, setRelay4] = useState(false);


  const fetchRelay = async () => {
    try {

      const res = await axios.get(
        `${BASE_URL}/api/relay`
      );

      const relayData = res.data.data;

      if (relayData) {
        setRelay1(relayData.relay1);
        setRelay2(relayData.relay2);
        setRelay3(relayData.relay3);
        setRelay4(relayData.relay4);
      }

    } catch (error) {
      console.error(
        "error in fetchRelay",
        error
      );
    }
  };

  const updateRelay = async (newData: any) => {
    try {

      await axios.post(
        `${BASE_URL}/api/relay`,
        newData
      );

      fetchRelay();

    } catch (error) {
      console.error(
        "Update error:",
        error
      );
    }
  };

  const allOn = async () => {
    updateRelay({
      relay1: true,
      relay2: true,
      relay3: true,
      relay4: true,
    });
  };

  // All OFF
  const allOff = async () => {
    updateRelay({
      relay1: false,
      relay2: false,
      relay3: false,
      relay4: false,
    });
  };

  useEffect(() => {
    fetchRelay();
  }, []);

  return (
    <View>

      <View style={styles.viewHeader}>
        <Text style={styles.textHeader}>
          House Blueprint
        </Text>
      </View>

      <View style={styles.allBtnRow}>

        <TouchableOpacity
          style={styles.allOnBtn}
          onPress={allOn}
        >
          <Text style={styles.allOnText}>
            All ON
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.allOffBtn}
          onPress={allOff}
        >
          <Text style={styles.allOffText}>
            All OFF
          </Text>
        </TouchableOpacity>

      </View>

      <View style={styles.relayBox}>

        <View style={styles.fourBox}>

          {/* LEFT COLUMN */}
          <View style={styles.leftColumn}>
            <View style={styles.livingRoom}>
              <Text style={styles.roomLabel}>
                Living Room
              </Text>

              <TouchableOpacity
                style={[
                  styles.powerBtn,
                  relay1 && styles.powerBtnActive,
                ]}
                onPress={() =>
                  updateRelay({
                    relay1: !relay1,
                  })
                }
              >
                <View
                  style={[
                    styles.powerLine,
                    relay1 &&
                      styles.powerIconActive,
                  ]}
                />

                <View
                  style={[
                    styles.powerCircle,
                    relay1 &&
                      styles.powerCircleActive,
                  ]}
                />

              </TouchableOpacity>

              <Text style={styles.relayTag}>
                Relay 1
              </Text>

            </View>

            {/* KITCHEN */}
            <View style={styles.kitchen}>

              <Text style={styles.roomLabel}>
                Kitchen
              </Text>

              <TouchableOpacity
                style={[
                  styles.powerBtn,
                  relay2 && styles.powerBtnActive,
                ]}
                onPress={() =>
                  updateRelay({
                    relay2: !relay2,
                  })
                }
              >

                <View
                  style={[
                    styles.powerLine,
                    relay2 &&
                      styles.powerIconActive,
                  ]}
                />

                <View
                  style={[
                    styles.powerCircle,
                    relay2 &&
                      styles.powerCircleActive,
                  ]}
                />

              </TouchableOpacity>

              <Text style={styles.relayTag}>
                Relay 2
              </Text>

            </View>

          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.rightColumn}>

            {/* BEDROOM */}
            <View style={styles.bedRoom}>

              <Text style={styles.roomLabel}>
                Bed Room
              </Text>

              <TouchableOpacity
                style={[
                  styles.powerBtn,
                  relay3 && styles.powerBtnActive,
                ]}
                onPress={() =>
                  updateRelay({
                    relay3: !relay3,
                  })
                }
              >

                <View
                  style={[
                    styles.powerLine,
                    relay3 &&
                      styles.powerIconActive,
                  ]}
                />

                <View
                  style={[
                    styles.powerCircle,
                    relay3 &&
                      styles.powerCircleActive,
                  ]}
                />

              </TouchableOpacity>

              <Text style={styles.relayTag}>
                Relay 3
              </Text>

            </View>

            {/* BATHROOM */}
            <View style={styles.bathRoom}>

              <Text style={styles.roomLabel}>
                Bathroom
              </Text>

              <TouchableOpacity
                style={[
                  styles.powerBtn,
                  relay4 && styles.powerBtnActive,
                ]}
                onPress={() =>
                  updateRelay({
                    relay4: !relay4,
                  })
                }
              >

                <View
                  style={[
                    styles.powerLine,
                    relay4 &&
                      styles.powerIconActive,
                  ]}
                />

                <View
                  style={[
                    styles.powerCircle,
                    relay4 &&
                      styles.powerCircleActive,
                  ]}
                />

              </TouchableOpacity>

              <Text style={styles.relayTag}>
                Relay 4
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default BluePrint;

const styles = StyleSheet.create({

  viewHeader: {
    alignItems: 'center',
    padding: 10,
    marginTop: 20,
    marginBottom: 10,
  },

  textHeader: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  allBtnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },

  allOnBtn: {
    borderWidth: 1.5,
    borderColor: '#2ecc71',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 28,
    backgroundColor: '#1a3a1a',
  },

  allOnText: {
    color: '#2ecc71',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },

  allOffBtn: {
    borderWidth: 1.5,
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 28,
    backgroundColor: '#3a1a1a',
  },

  allOffText: {
    color: '#e74c3c',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },

  relayBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  fourBox: {
    flexDirection: 'row',
    width: '90%',
    height: 520,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
  },

  leftColumn: {
    flex: 1,                        // FIXED: was width: '50%'
    borderRightWidth: 1,
    borderRightColor: '#ffffff',
  },

  rightColumn: {
    flex: 1,                        // FIXED: was width: '50%'
  },

  livingRoom: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
  },

  kitchen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bedRoom: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
  },

  bathRoom: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  roomLabel: {
    color: '#a0b4d6',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  relayTag: {
    color: '#4a5568',
    fontSize: 10,
    marginTop: 6,
  },

  powerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4a5568',
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },

  powerBtnActive: {
    borderColor: '#2ecc71',         // GREEN border when ON
    backgroundColor: '#1d3b2a',    // dark green bg when ON
  },

  powerLine: {
    position: 'absolute',
    top: 8,
    width: 3,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#4a5568',
    zIndex: 1,
  },

  powerIconActive: {
    backgroundColor: '#2ecc71',    
  },

  powerCircle: {
    position: 'absolute',
    bottom: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#4a5568',
  },

  powerCircleActive: {
    borderColor: '#2ecc71',        
  },

});
