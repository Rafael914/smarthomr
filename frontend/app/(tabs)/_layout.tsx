import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Storage } from '@/utils/storage';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { GeofenceWebBootstrap } from '@/components/GeofenceWebBootstrap';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const compactWebTabs = Platform.OS === 'web' && width < 700;
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
    <>
    {isAdmin && <GeofenceWebBootstrap />}
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
        tabBarLabelStyle: {
          fontSize: compactWebTabs ? 9 : 12,
          fontWeight: '700',
          marginBottom: compactWebTabs ? 5 : 8,
          textAlign: 'center',
        },
        tabBarIconStyle: { marginTop: compactWebTabs ? 5 : 7, justifyContent: 'center', alignItems: 'center' },
        tabBarItemStyle: compactWebTabs
          ? { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, paddingHorizontal: 0 }
          : { flexGrow: 0, flexShrink: 0, flexBasis: 132 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarItemStyle: compactWebTabs ? undefined : { flexGrow: 0, flexShrink: 0, flexBasis: 132, marginStart: 'auto' }, tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="blueprint" options={{ title: 'Blueprint', tabBarIcon: ({ color, size }) => <Ionicons name="flash-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="pzemHistory" options={{ title: 'History', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="auditLog" options={{ title: 'Audit Log', href: isAdmin ? undefined : null, tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="geofence" options={{ title: 'Geofence', href: isAdmin ? undefined : null, tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="register" options={{ title: 'Register', href: isAdmin ? undefined : null, tabBarIcon: ({ color, size }) => <Ionicons name="person-add-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="logout" options={{ title: 'Log out', tabBarItemStyle: compactWebTabs ? undefined : { flexGrow: 0, flexShrink: 0, flexBasis: 132, marginEnd: 'auto' }, tabBarIcon: ({ color, size }) => <Ionicons name="log-out-outline" color={color} size={size} /> }} />
    </Tabs>
    </>
  );
}
