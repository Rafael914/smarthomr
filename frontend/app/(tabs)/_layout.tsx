import { Tabs } from 'expo-router';
import React from 'react';
import { Text, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: '#0b0f19',
          borderTopColor: '#2a2f4e',
          elevation: 8, 
          shadowOpacity: 0, 
          // Enforces standard vertical heights on web viewports
          ...Platform.select({
            web: {
              height: 65,
              paddingBottom: 8,
            },
          }),
        },
        tabBarActiveTintColor: '#22c55e',   
        tabBarInactiveTintColor: '#6b7280',  
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4, 
          justifyContent: 'center',
          alignItems: 'center',
        }
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: () => (
            <Text style={{ fontSize: 20, textAlign: 'center' }}>📊</Text>
          ),
        }}
      />
      
      <Tabs.Screen
        name="outlets"
        options={{
          title: 'Outlets',
          tabBarIcon: () => (
            <Text style={{ fontSize: 20, textAlign: 'center' }}>⚡</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="geofence"
        options={{
          title: 'Geofence',
          tabBarIcon: () => (
            <Text style={{ fontSize: 20, textAlign: 'center' }}>📍</Text>
          ),
        }}
      />
    </Tabs>
  );
}