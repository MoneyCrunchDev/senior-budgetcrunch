import { StyleSheet } from "react-native";

const GRID = 8;

/** Styles shared by calendar week/day bottom sheet bodies and week summary badges. */
export const sheetContentStyles = StyleSheet.create({
  weekBadge: {
    paddingHorizontal: GRID * 1.5,
    paddingVertical: GRID / 2,
    borderRadius: 999,
  },
  weekBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  heroCard: {
    backgroundColor: "#F4F6FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    lineHeight: 26,
  },
  heroExplainer: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 14,
  },
  heroTotal: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroTotalSuffix: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  statPill: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: "28%",
    flexGrow: 1,
  },
  statPillValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  statPillLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  insightCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D1D5DB",
  },
  insightCalloutBody: {
    flex: 1,
  },
  insightCalloutLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  insightCalloutValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  redDayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: GRID,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E8EC",
  },
  redDayItem: {
    fontSize: 14,
    color: "#C62828",
    fontWeight: "600",
  },

  sectionHint: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 17,
    marginBottom: GRID,
  },

  sectionCard: {
    backgroundColor: "#F8F9FB",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    borderRadius: GRID * 1.5,
    padding: GRID * 2,
    marginBottom: GRID * 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: GRID,
  },
  catRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: GRID,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E8EC",
  },
  catLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: GRID,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: GRID,
  },
  catName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    flex: 1,
  },
  catRight: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  catAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  catBudget: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    marginLeft: 2,
  },

  txnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: GRID * 1.25,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E8EC",
  },
  txnLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: GRID,
  },
  txnName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  txnCat: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
});
