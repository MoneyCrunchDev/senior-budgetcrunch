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

type Props = {
  transactions: Transaction[];
  onClose: () => void;
};

const ACCENT = "#0A6EF2";
const CARD_BG = "#F4F6FA";
const INK = "#111827";
const MUTED = "#6B7280";

function locationLabel(transactions: Transaction[]): string {
  const merchants = new Set(
    transactions.map((t) => t.merchant_name || t.name || "Unknown")
  );
  if (merchants.size === 1) return [...merchants][0];
  if (merchants.size > 1) return "Multiple Merchants";
  return "Spending";
}

export default function MoneyPitSheetContent({
  transactions,
  onClose,
}: Props) {
  const label = locationLabel(transactions);
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

  const listHeader = (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {label}
        </Text>
        <Text style={styles.heroTotal}>
          ${total.toFixed(2)}{" "}
          <Text style={styles.heroTotalSuffix}>total</Text>
        </Text>
        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillValue}>{transactions.length}</Text>
            <Text style={styles.statPillLabel}>
              visit{transactions.length !== 1 ? "s" : ""}
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
            <Text style={styles.statPillLabel}>avg / visit</Text>
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
            <Ionicons name="trending-up" size={18} color="#B45309" />
            <View style={styles.insightCalloutBody}>
              <Text style={styles.insightCalloutLabel}>Largest charge</Text>
              <Text style={styles.insightCalloutValue} numberOfLines={1}>
                {formatTransactionAmount(largest.amount)} at {rowTitle(largest)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {topMerchants.length > 1 && (
        <View style={styles.breakdown}>
          <Text style={styles.sectionTitle}>Share by merchant</Text>
          {topMerchants.map((m) => {
            const pct = maxBar > 0 ? Math.round((m.total / total) * 100) : 0;
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
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sheetEyebrow}>Spending at this money pit</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

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
                    {group.transactions.length} visit
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
    fontSize: 12,
    fontWeight: "600",
    color: MUTED,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  closeBtn: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  closeText: {
    fontSize: 16,
    color: ACCENT,
    fontWeight: "600",
  },
  hero: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: INK,
    marginBottom: 6,
    lineHeight: 26,
  },
  heroTotal: {
    fontSize: 32,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroTotalSuffix: {
    fontSize: 16,
    fontWeight: "600",
    color: MUTED,
    letterSpacing: 0,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: "30%",
    flexGrow: 1,
  },
  statPillValue: {
    fontSize: 17,
    fontWeight: "800",
    color: INK,
  },
  statPillLabel: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
    fontWeight: "500",
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroMetaText: {
    fontSize: 14,
    color: MUTED,
    fontWeight: "500",
    flex: 1,
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
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  insightCalloutValue: {
    fontSize: 14,
    fontWeight: "600",
    color: INK,
  },
  breakdown: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  breakdownRow: {
    marginBottom: 12,
  },
  breakdownHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
    gap: 8,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: INK,
  },
  breakdownAmt: {
    fontSize: 14,
    fontWeight: "700",
    color: INK,
  },
  breakdownPct: {
    fontWeight: "500",
    color: MUTED,
    fontSize: 13,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  merchantCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  merchantHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#FAFBFC",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  merchantHeaderBody: {
    flex: 1,
    minWidth: 0,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "700",
    color: INK,
  },
  merchantMeta: {
    fontSize: 13,
    color: MUTED,
    marginTop: 4,
    fontWeight: "500",
  },
  txLines: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  txLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: 12,
  },
  txLineBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EEF0F3",
  },
  txLineLeft: {
    flex: 1,
    minWidth: 0,
  },
  txLineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  txLineDate: {
    fontSize: 15,
    fontWeight: "600",
    color: INK,
  },
  txLineCat: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
  },
  txLineAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
    paddingTop: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  pendingBadgeInline: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  pendingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
  },
});
