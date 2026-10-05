import React from "react";
import { SafeAreaView } from "react-native";
import PzemHistory from "../../components/pzemHistory";

export default function PzemHistoryScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#001424" }}>
      <PzemHistory />
    </SafeAreaView>
  );
}
