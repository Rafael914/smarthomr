import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

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