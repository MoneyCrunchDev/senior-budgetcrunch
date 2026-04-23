import { StyleSheet } from "react-native";

import { colors, fontSize, fontWeight, radius, spacing } from "@/theme";

/** Styles shared by calendar week/day bottom sheet bodies and week summary badges. */
export const sheetContentStyles = StyleSheet.create({
  weekBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  weekBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  heroCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 26,
  },
  heroExplainer: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 14,
  },
  heroTotal: {
    fontSize: 30,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroTotalSuffix: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPlaceholder,
    letterSpacing: 0,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  statPill: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    minWidth: "28%",
    flexGrow: 1,
  },
  statPillValue: {
    fontSize: 17,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
  },
  statPillLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: fontWeight.medium,
    lineHeight: 14,
  },
  insightCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  insightCalloutBody: {
    flex: 1,
  },
  insightCalloutLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  insightCalloutValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },

  sectionHint: {
    fontSize: fontSize.sm,
    color: colors.textPlaceholder,
    lineHeight: 17,
    marginBottom: spacing.xs,
  },

  sectionCard: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  catRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  catLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: spacing.xs,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  catName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  catRight: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  catAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  catBudget: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPlaceholder,
    marginLeft: 2,
  },

  txnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  txnLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.xs,
  },
  txnName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  txnCat: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  txnAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  /** Compact "over daily limit" date chips (week sheet). */
  sectionCardCompact: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  sectionTitleCompact: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  overrunChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  overrunChip: {
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.dangerBorder,
  },
  overrunChipText: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    color: colors.dangerStrong,
  },

  /** Redesigned sheet header (week + day). */
  sheetHero: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    padding: 14,
    marginBottom: spacing.sm,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  sheetHeaderTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  sheetHeroMuted: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 10,
  },
  sheetTotalMain: {
    fontSize: 28,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sheetTotalSub: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPlaceholder,
    marginTop: 2,
  },
  overInlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  overInlineLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },

  listBlock: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  listBlockTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  listBlockTitleInline: {
    marginBottom: 0,
    flex: 1,
    minWidth: 0,
  },
  listBlockHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: spacing.xs,
  },
  listBlockHeaderMeta: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    flexShrink: 0,
  },
  listBlockHeaderMetaWarn: {
    color: colors.dangerText,
  },
  listBlockHeaderMetaOk: {
    color: colors.successText,
  },
  listBlockFoot: {
    fontSize: fontSize.xs,
    color: colors.textPlaceholder,
    lineHeight: 15,
    marginTop: 10,
  },

  catBlock: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  catBlockTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    overflow: "hidden",
    marginTop: spacing.xs,
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
});
