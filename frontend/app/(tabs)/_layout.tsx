import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Storage } from '@/utils/storage';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  useEffect(() => {
    Promise.all([Storage.getItem('token'), Storage.getItem('role')]).then(([token, role]) => {
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      setIsAdmin(role === 'admin');
      setCheckingAuth(false);
    });
  }, []);
  if (checkingAuth) return null;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'top',
        tabBarStyle: {
          backgroundColor: '#081522',
          borderBottomColor: '#193148',
          borderBottomWidth: 1,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 64,
          paddingHorizontal: 16,
          justifyContent: 'center',
          ...Platform.select({
            web: {
              backgroundColor: '#06111f',
              borderBottomColor: '#193148',
              borderBottomWidth: 1,
              height: 68,
              width: '100%',
            },
          }),
        },
        tabBarActiveTintColor: '#6ee7b7',
        tabBarInactiveTintColor: '#8392a5',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
        tabBarIconStyle: { marginTop: 7, justifyContent: 'center', alignItems: 'center' },
        tabBarItemStyle: { flexGrow: 0, flexShrink: 0, flexBasis: 132 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarItemStyle: { flexGrow: 0, flexShrink: 0, flexBasis: 132, marginStart: 'auto' }, tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="outlets" options={{ title: 'Outlets', tabBarIcon: ({ color, size }) => <Ionicons name="flash-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="pzemHistory" options={{ title: 'History', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="geofence" options={{ title: 'Geofence', tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="register" options={{ title: 'Register', href: isAdmin ? undefined : null, tabBarIcon: ({ color, size }) => <Ionicons name="person-add-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="logout" options={{ title: 'Log out', tabBarItemStyle: { flexGrow: 0, flexShrink: 0, flexBasis: 132, marginEnd: 'auto' }, tabBarIcon: ({ color, size }) => <Ionicons name="log-out-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
