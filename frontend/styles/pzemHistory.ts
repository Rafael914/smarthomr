import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001424",
  },
  content: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: "#8888a0",
    fontSize: 13,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "#16213e",
    borderColor: "#2a2f4e",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    padding: 16,
  },
  summaryLabel: {
    color: "#6b7280",
    fontSize: 11,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#facc15",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryHint: {
    color: "#8888a0",
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: "#16213e",
    borderColor: "#2a2f4e",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  historyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  outletName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  timestamp: {
    color: "#8888a0",
    fontSize: 11,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metric: {
    backgroundColor: "#0f172a",
    borderColor: "#2a2f4e",
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 88,
    padding: 8,
  },
  metricLabel: {
    color: "#6b7280",
    fontSize: 10,
  },
  metricValue: {
    color: "#f3f4f6",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  message: {
    color: "#a0a0b0",
    fontSize: 14,
    paddingVertical: 20,
    textAlign: "center",
  },
  error: {
    color: "#f87171",
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: "#14532d",
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 10,
  },
  refreshButtonText: {
    color: "#d1fae5",
    fontSize: 13,
    fontWeight: "700",
  },
});

export default styles;
