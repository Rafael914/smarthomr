import { Stack } from 'expo-router';
import React from "react";
import '@/utils/authSession';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='(tabs)' />
    </Stack>
  );
}
