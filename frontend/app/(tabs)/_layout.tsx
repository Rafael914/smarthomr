import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Match the deep dark theme profile of your dashboard
        tabBarStyle: {
          backgroundColor: '#0b0f19',
          borderTopColor: '#2a2f4e',
          // Let the device handle height and native safe areas naturally
          elevation: 8, // Clean shadow elevation separator for Android
          shadowOpacity: 0, // Removes messy iOS default hair shadows
        },
        tabBarActiveTintColor: '#22c55e',    // Active green state matching your relay indicators
        tabBarInactiveTintColor: '#6b7280',  // Muted gray for inactive states
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4, // Clean minimal breathing room for text labels
        },
        tabBarIconStyle: {
          marginTop: 4, // Aligns icons beautifully with the labels below
        }
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "grid" : "grid-outline"} 
              size={20} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="outlets"
        options={{
          title: 'Outlets',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "flash" : "flash-outline"} 
              size={20} 
              color={color} 
            />
          ),
        }}
      />

    </Tabs>
  );
}