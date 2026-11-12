import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Storage } from '@/utils/storage';
import axios from 'axios';
import { BASE_URL } from '@/utils/api';

export default function Logout() {
  useFocusEffect(useCallback(() => {
    let active = true;
    const finishLogout = async () => {
      const refreshToken = await Storage.getItem('refreshToken');
      if (refreshToken) {
        try { await axios.post(`${BASE_URL}/api/auth/logout`, { refreshToken }); } catch {}
      }
      await Storage.removeItem('refreshToken');
      await Storage.removeItem('token');
      await Storage.removeItem('userId');
      await Storage.removeItem('role');
      router.replace('/auth/login');
    };
    const cancel = () => { if (active) router.back(); };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) void finishLogout();
      else cancel();
    } else {
      Alert.alert('Log out?', 'You will need to sign in again to control the appliances.', [
        { text: 'Cancel', style: 'cancel', onPress: cancel },
        { text: 'Log out', style: 'destructive', onPress: () => void finishLogout() },
      ]);
    }
    return () => { active = false; };
  }, []));

  return <View style={styles.container}><ActivityIndicator color="#6ee7b7" /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#081522', alignItems: 'center', justifyContent: 'center' } });
