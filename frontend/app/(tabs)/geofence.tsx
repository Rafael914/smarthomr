// app/(tabs)/geofence.tsx
import { ScrollView, StyleSheet, SafeAreaView, Platform, View } from "react-native";
import { GeofenceSettings } from "../../components/GeofenceSettings";

export default function GeofenceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "web" ? (
        <View style={styles.webContainer}>
          <GeofenceSettings />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <GeofenceSettings />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001424",
  },
  webContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
