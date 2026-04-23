import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Transaction } from "@/lib/plaidApi";
import {
  formatTransactionAmount,
  formatTransactionDateShort,
} from "@/lib/formatTransaction";
import {
  avatarColor,
  computeFormattedDateSpan,
  displayCategory,
  groupTransactionsByMerchant,
  initials,
  merchantAggregates,
  rowTitle,
  totalSpent,
  type MerchantGroup,
} from "@/lib/merchantTransactionGroups";
import { colors, fontSize, fontWeight, radius, spacing } from "@/theme";

type Props = {
  transactions: Transaction[];
  onClose: () => void;
};

/** Local aliases to keep the JSX terse — all values live in the theme. */
const ACCENT = colors.link;
const CARD_BG = colors.surfaceSubtle;
const INK = colors.textPrimary;
const MUTED = colors.textMuted;

export default function UntrackedEnvelopeSheetContent({
  transactions,
  onClose,
}: Props) {
  const total = totalSpent(transactions);
  const aggs = useMemo(
    () => merchantAggregates(transactions),
    [transactions]
  );
  const avg =
    transactions.length > 0 ? total / transactions.length : 0;
  const largest = useMemo(() => {
    if (transactions.length === 0) return null;
    return transactions.reduce((best, t) =>
      Math.abs(t.amount) > Math.abs(best.amount) ? t : best
    );
  }, [transactions]);
  const dateSpan = useMemo(
    () => computeFormattedDateSpan(transactions),
    [transactions]
  );
  const topMerchants = aggs.slice(0, 5);
  const maxBar = topMerchants[0]?.total ?? 1;
  const merchantGroups = useMemo(
    () => groupTransactionsByMerchant(transactions),
    [transactions]
  );

  const listHeader =
    transactions.length > 0 ? (
      <>
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="map-outline" size={22} color={ACCENT} />
          </View>
          <Text style={styles.heroTitle}>No map location</Text>
          <Text style={styles.heroSubtitle}>
            These transactions don’t have coordinates from your bank (common in
            Sandbox and for online purchases). The heatmap only includes
            spending with a location.
          </Text>
          <Text style={styles.heroTotal}>
            ${total.toFixed(2)}{" "}
            <Text style={styles.heroTotalSuffix}>total</Text>
          </Text>
          <View style={styles.statRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{transactions.length}</Text>
              <Text style={styles.statPillLabel}>
                transaction{transactions.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{aggs.length}</Text>
              <Text style={styles.statPillLabel}>
                merchant{aggs.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>${avg.toFixed(0)}</Text>
              <Text style={styles.statPillLabel}>avg / txn</Text>
            </View>
          </View>
          {dateSpan && (
            <View style={styles.heroMeta}>
              <Ionicons name="calendar-outline" size={16} color={MUTED} />
              <Text style={styles.heroMetaText}>
                {dateSpan.same
                  ? dateSpan.from
                  : `${dateSpan.from} → ${dateSpan.to}`}
              </Text>
            </View>
          )}
          {largest && (
            <View style={styles.insightCallout}>
              <Ionicons name="trending-up" size={18} color={colors.warningStrong} />
              <View style={styles.insightCalloutBody}>
                <Text style={styles.insightCalloutLabel}>Largest charge</Text>
                <Text style={styles.insightCalloutValue} numberOfLines={1}>
                  {formatTransactionAmount(largest.amount)} at{" "}
                  {rowTitle(largest)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {topMerchants.length > 1 && (
          <View style={styles.breakdown}>
            <Text style={styles.sectionTitle}>Share by merchant</Text>
            {topMerchants.map((m) => {
              const pct =
                total > 0 ? Math.round((m.total / total) * 100) : 0;
              const barW = maxBar > 0 ? (m.total / maxBar) * 100 : 0;
              return (
                <View key={m.label} style={styles.breakdownRow}>
                  <View style={styles.breakdownHead}>
                    <Text style={styles.breakdownLabel} numberOfLines={1}>
                      {m.label}
                    </Text>
                    <Text style={styles.breakdownAmt}>
                      ${m.total.toFixed(2)}{" "}
                      <Text style={styles.breakdownPct}>({pct}%)</Text>
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${barW}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.listSectionTitle}>Activity</Text>
      </>
    ) : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sheetEyebrow}>Not on the heatmap</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyHero}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="checkmark-circle-outline" size={22} color={ACCENT} />
          </View>
          <Text style={styles.heroTitle}>No map location</Text>
          <Text style={styles.heroSubtitle}>
            These transactions don’t have coordinates from your bank (common in
            Sandbox and for online purchases). The heatmap only includes
            spending with a location.
          </Text>
          <Text style={styles.emptyText}>
            Nothing to show — all loaded transactions have map coordinates, or
            you have no transactions yet.
          </Text>
        </View>
      ) : (
        <BottomSheetFlatList<MerchantGroup>
          data={merchantGroups}
          keyExtractor={(g: MerchantGroup) =>
            `${g.label}:${g.transactions
              .map((t: Transaction) => t.transaction_id)
              .join(",")}`
          }
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          renderItem={({ item: group }: { item: MerchantGroup }) => {
            const bg = avatarColor(group.label);
            return (
              <View style={styles.merchantCard}>
                <View style={styles.merchantHeader}>
                  <View style={[styles.avatar, { backgroundColor: bg }]}>
                    <Text style={styles.avatarText}>
                      {initials(group.label)}
                    </Text>
                  </View>
                  <View style={styles.merchantHeaderBody}>
                    <Text style={styles.merchantName} numberOfLines={2}>
                      {group.label}
                    </Text>
                    <Text style={styles.merchantMeta}>
                      {group.transactions.length} transaction
                      {group.transactions.length !== 1 ? "s" : ""} · $
                      {group.merchantTotal.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.txLines}>
                  {group.transactions.map((t: Transaction, idx: number) => {
                    const lineCat =
                      displayCategory(t.personal_finance_category) ??
                      displayCategory(t.category);
                    const showCat =
                      Boolean(lineCat) && group.transactions.length === 1;
                    return (
                      <View
                        key={t.transaction_id}
                        style={[
                          styles.txLine,
                          idx > 0 && styles.txLineBorder,
                        ]}
                      >
                        <View style={styles.txLineLeft}>
                          <View style={styles.txLineTitleRow}>
                            <Text style={styles.txLineDate}>
                              {formatTransactionDateShort(t.date)}
                            </Text>
                            {t.pending ? (
                              <View style={styles.pendingBadgeInline}>
                                <Text style={styles.pendingText}>Pending</Text>
                              </View>
                            ) : null}
                          </View>
                          {showCat ? (
                            <Text style={styles.txLineCat} numberOfLines={1}>
                              {lineCat}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.txLineAmount}>
                          {formatTransactionAmount(t.amount)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 120,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetEyebrow: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: MUTED,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  closeBtn: {
    paddingVertical: spacing.xxs,
    paddingLeft: spacing.xs,
  },
  closeText: {
    fontSize: fontSize.lg,
    color: ACCENT,
    fontWeight: fontWeight.semibold,
  },
  emptyHero: {
    backgroundColor: CARD_BG,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginTop: spacing.xxs,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  hero: {
    backgroundColor: CARD_BG,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: INK,
    marginBottom: spacing.xs,
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    color: MUTED,
    lineHeight: 20,
    marginBottom: 14,
  },
  heroTotal: {
    fontSize: 32,
    fontWeight: fontWeight.extrabold,
    color: colors.danger,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroTotalSuffix: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: MUTED,
    letterSpacing: 0,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  statPill: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    minWidth: "30%",
    flexGrow: 1,
  },
  statPillValue: {
    fontSize: 17,
    fontWeight: fontWeight.extrabold,
    color: INK,
  },
  statPillLabel: {
    fontSize: fontSize.xs,
    color: MUTED,
    marginTop: 2,
    fontWeight: fontWeight.medium,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  heroMetaText: {
    fontSize: fontSize.base,
    color: MUTED,
    fontWeight: fontWeight.medium,
    flex: 1,
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
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  insightCalloutValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: INK,
  },
  breakdown: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    marginBottom: spacing.sm,
  },
  breakdownHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
    gap: spacing.xs,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: INK,
  },
  breakdownAmt: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: INK,
  },
  breakdownPct: {
    fontWeight: fontWeight.medium,
    color: MUTED,
    fontSize: 13,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: MUTED,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 22,
  },
  merchantCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  merchantHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: 10,
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  merchantHeaderBody: {
    flex: 1,
    minWidth: 0,
  },
  merchantName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: INK,
  },
  merchantMeta: {
    fontSize: 13,
    color: MUTED,
    marginTop: spacing.xxs,
    fontWeight: fontWeight.medium,
  },
  txLines: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xxs,
  },
  txLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: spacing.sm,
  },
  txLineBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  txLineLeft: {
    flex: 1,
    minWidth: 0,
  },
  txLineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  txLineDate: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: INK,
  },
  txLineCat: {
    fontSize: fontSize.sm,
    color: MUTED,
    marginTop: spacing.xxs,
  },
  txLineAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: INK,
    paddingTop: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
  },
  pendingBadgeInline: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  pendingText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.warningStrong,
  },
});
