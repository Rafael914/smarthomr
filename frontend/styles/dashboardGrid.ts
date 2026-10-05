import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  rootScrollView: {},
  scrollContent: { 
    paddingBottom: 40, 
    minHeight: "100%",
    alignItems: "center"
  },
  mainContainer: {
    width: "100%",
    maxWidth: 1024,
    paddingHorizontal: 16,
  },

  // ── Header UI ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
    marginBottom: 20,
    width: "100%",
  },
  headerTextGroup: { alignItems: "flex-start" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "#8888a0", marginTop: 4 },

  logoutBtn: {
    borderWidth: 1,
    borderColor: "#e74c3c55",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1a0a0a",
  },
  logoutBtnText: { color: "#e74c3c", fontSize: 12, fontWeight: "700" },

  // ── Switch Layout Components ──
  switchTrack: { 
    width: 50, 
    height: 28, 
    borderRadius: 14, 
    flexDirection: "row",   
    alignItems: "center",    
    paddingHorizontal: 3,
  },
  switchTrackOn: { backgroundColor: "#22c55e" },
  switchTrackOff: { backgroundColor: "#374151" },
  trackAlignOn: { justifyContent: "flex-end" },    
  trackAlignOff: { justifyContent: "flex-start" },  

  switchThumb: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    backgroundColor: "#fff" 
  },

  // ── Relay Smart Cards Layout ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    width: "100%",
  },
  card: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2a2f4e",
    gap: 8,
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 260,
  },
  cardActive: { borderColor: "#22c55e55", backgroundColor: "#0f2a1a" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  relayIcon: { fontSize: 26 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotOn: { backgroundColor: "#22c55e" },
  dotOff: { backgroundColor: "#374151" },
  relayLabel: { fontSize: 11, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 },
  relayName: { fontSize: 15, fontWeight: "600", color: "#fff" },
  schedBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  schedBadge: { backgroundColor: "#14532d", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  schedBadgeOff: { backgroundColor: "#3a1a1a" },
  schedBadgeText: { fontSize: 10, color: "#d1fae5" },
  divider: { height: 1, backgroundColor: "#2a2f4e", marginVertical: 4 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeOn: { backgroundColor: "#14532d" },
  badgeOff: { backgroundColor: "#1f2937" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeTextOn: { color: "#22c55e" },
  badgeTextOff: { color: "#6b7280" },
  schedBtn: { borderWidth: 1, borderColor: "#2a2f4e", borderRadius: 8, paddingVertical: 6, alignItems: "center", marginTop: 4 },
  schedBtnActive: { borderColor: "#22c55e55", backgroundColor: "#0a2a18" },
  schedBtnText: { fontSize: 11, color: "#8888a0" },

  // ── Telemetry Styling ──
  sectionHeader: { alignItems: "flex-start", marginTop: 36, marginBottom: 14, width: "100%" },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  sectionSub: { fontSize: 12, color: "#8888a0", marginTop: 2 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 16, width: "100%" },
  summaryCard: { 
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 260,
    backgroundColor: "#16213e", 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#2a2f4e", 
    padding: 16 
  },
  summaryLabel: { fontSize: 11, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: "700", color: "#facc15" },
  summaryUnit: { fontSize: 14, fontWeight: "400", color: "#8888a0" },

  pzemGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap",
    gap: 16, 
    width: "100%",
    marginBottom: 20,
  },
  pzemCard: { 
    backgroundColor: "#16213e", 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: "#2a2f4e", 
    padding: 16,
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 290, 
  },
  pzemCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  pzemOutletIcon: { fontSize: 22 },
  pzemOutletLabel: { fontSize: 10, color: "#6b7280", textTransform: "uppercase", fontWeight: "600" },
  pzemOutletName: { fontSize: 15, fontWeight: "600", color: "#fff" },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e", marginLeft: "auto" },
  liveDotOffline: { backgroundColor: "#374151" },
  pzemDivider: { height: 1, backgroundColor: "#2a2f4e", marginVertical: 12 },

  pzemHeroRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, gap: 12 },
  pzemHeroBlock: { flex: 1, backgroundColor: "#0f172a", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#2a2f4e" },
  pzemHeroLabel: { fontSize: 11, color: "#6b7280", marginBottom: 2 },
  pzemInlineUnit: { flexDirection: "row", alignItems: "baseline" },
  pzemVoltageValue: { fontSize: 22, fontWeight: "700", color: "#3b82f6" },
  pzemHeroUnit: { fontSize: 13, color: "#3b82f6", fontWeight: "600" },

  offlineText: { color: "#374151" },

  pzemStatsGrid: { flexDirection: "row", justifyContent: "space-between", gap: 6, marginBottom: 12 },
  pzemStatItem: { flex: 1, backgroundColor: "#0f172a", borderRadius: 8, padding: 6, borderWidth: 1, borderColor: "#2a2f4e", alignItems: "center" },
  pzemStatLabel: { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  pzemStatValue: { fontSize: 13, fontWeight: "600", color: "#f3f4f6" },
  pzemStatUnit: { fontSize: 9, color: "#6b7280" },

  pzemEnergyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#2a2f4e", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  pzemEnergyLabel: { fontSize: 11, color: "#a0a0b0", fontWeight: "500" },
  pzemEnergyValue: { fontSize: 13, fontWeight: "700", color: "#10b981" },

  // ── Modal Styles ──
  modalOverlay: { flex: 1, backgroundColor: "#000000aa", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#16213e", borderRadius: 16, padding: 24, width: "85%", maxWidth: 420, borderWidth: 1, borderColor: "#2a2f4e" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  modalSub: { fontSize: 11, color: "#6b7280", marginBottom: 16 },
  inputLabel: { fontSize: 12, color: "#a0a0b0", marginBottom: 6 },
  input: { backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#2a2f4e", borderRadius: 8, color: "#fff", paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 14 },
  modalBtnRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  clearBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#e74c3c55", alignItems: "center" },
  clearBtnText: { color: "#e74c3c", fontWeight: "700", fontSize: 13 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#2a2f4e", alignItems: "center" },
  cancelBtnText: { color: "#6b7280", fontWeight: "700", fontSize: 13 },
  saveBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: "#22c55e", alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});

export default styles;
