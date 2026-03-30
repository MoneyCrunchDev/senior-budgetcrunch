import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { getPrimaryLabel } from "@/lib/categoryHelpers";
import type { DaySummary } from "./sheetTypes";
import { sheetContentStyles as styles } from "./sheetContentStyles";
import { formatDateNice, formatMoney } from "./sheetUtils";

type Props = {
  summary: DaySummary | null;
  dateStr: string;
};

export default function CalendarDaySheetContent({ summary, dateStr }: Props) {
  if (!summary) return null;

  const {
    budgetedRows,
    unbudgetedTotal,
    totalSpent,
    isRedDay,
    hasBudgets: hasBudg,
    transactions: dayTxns,
  } = summary;

  const overRows = budgetedRows.filter((r) => r.isOver);
  const worstCat =
    overRows.length > 0
      ? overRows.reduce((a, b) =>
          b.spent - b.dailyBudget > a.spent - a.dailyBudget ? b : a
        )
      : null;

  const dayIcon: keyof typeof Ionicons.glyphMap = isRedDay
    ? "warning"
    : totalSpent === 0
      ? "sunny"
      : "checkmark-circle";
  const dayIconColor = isRedDay
    ? "#C62828"
    : totalSpent === 0
      ? "#F57F17"
      : "#1B5E20";
  const dayIconBg = isRedDay
    ? "#FFEBEE"
    : totalSpent === 0
      ? "#FFF9C4"
      : "#E8F5E9";

  return (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={[styles.heroIconWrap, { backgroundColor: dayIconBg }]}>
            <Ionicons name={dayIcon} size={20} color={dayIconColor} />
          </View>
          {hasBudg ? (
            <View
              style={[
                styles.weekBadge,
                { backgroundColor: isRedDay ? "#FFEBEE" : "#E8F5E9" },
              ]}
            >
              <Text
                style={[
                  styles.weekBadgeText,
                  { color: isRedDay ? "#C62828" : "#1B5E20" },
                ]}
              >
                {isRedDay ? "Over Daily Target" : "Within Target"}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.heroTitle}>{formatDateNice(dateStr)}</Text>

        {hasBudg && isRedDay ? (
          <Text style={styles.heroExplainer}>
            At least one category exceeded its daily budget today. The day is
            marked red even if your total looks fine — it means specific
            categories need attention.
          </Text>
        ) : null}
        {hasBudg && !isRedDay && totalSpent > 0 ? (
          <Text style={styles.heroExplainer}>
            All budgeted categories stayed within their daily targets today. Nice
            pacing!
          </Text>
        ) : null}
        {totalSpent === 0 ? (
          <Text style={styles.heroExplainer}>
            No outflows recorded for this day.
          </Text>
        ) : null}

        <Text
          style={[
            styles.heroTotal,
            {
              color:
                totalSpent === 0
                  ? "#6B7280"
                  : isRedDay
                    ? "#DC2626"
                    : "#15803D",
            },
          ]}
        >
          {formatMoney(totalSpent)}{" "}
          <Text style={styles.heroTotalSuffix}>total spent</Text>
        </Text>

        {hasBudg ? (
          <View style={styles.statRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{dayTxns.length}</Text>
              <Text style={styles.statPillLabel}>
                transaction{dayTxns.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.statPill}>
              <Text
                style={[
                  styles.statPillValue,
                  overRows.length > 0 && localStyles.statWarn,
                ]}
              >
                {overRows.length}
              </Text>
              <Text style={styles.statPillLabel}>
                cat{overRows.length !== 1 ? "s" : ""} over
              </Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>
                {formatMoney(unbudgetedTotal)}
              </Text>
              <Text style={styles.statPillLabel}>untracked</Text>
            </View>
          </View>
        ) : null}

        {worstCat ? (
          <View style={styles.insightCallout}>
            <Ionicons name="trending-up" size={18} color="#C62828" />
            <View style={styles.insightCalloutBody}>
              <Text style={styles.insightCalloutLabel}>Biggest overrun</Text>
              <Text style={styles.insightCalloutValue} numberOfLines={1}>
                {worstCat.name}: {formatMoney(worstCat.spent)} spent vs.{" "}
                {formatMoney(worstCat.dailyBudget)} daily target
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {!hasBudg && totalSpent > 0 ? (
        <View style={styles.sectionCard}>
          <View style={localStyles.infoRow}>
            <Ionicons name="information-circle" size={18} color="#6B7280" />
            <Text style={styles.sectionHint}>
              Set monthly budgets in Activity → Categories to enable per-category
              tracking here.
            </Text>
          </View>
        </View>
      ) : null}

      {hasBudg && budgetedRows.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Budget Breakdown</Text>
          <Text style={styles.sectionHint}>
            Daily target = your monthly budget for each category, divided by the
            number of days this month.
          </Text>
          {budgetedRows.map((row) => (
            <View key={row.slug} style={styles.catRow}>
              <View style={styles.catLeft}>
                <View style={[styles.catDot, { backgroundColor: row.color }]} />
                <Text style={styles.catName} numberOfLines={1}>
                  {row.name}
                </Text>
              </View>
              <View style={styles.catRight}>
                <Text
                  style={[
                    styles.catAmount,
                    { color: row.isOver ? "#FF3B30" : "#34C759" },
                  ]}
                >
                  {formatMoney(row.spent)}
                </Text>
                <Text style={styles.catBudget}>
                  / {formatMoney(row.dailyBudget)}
                </Text>
              </View>
            </View>
          ))}

          {unbudgetedTotal > 0 ? (
            <View style={styles.catRow}>
              <View style={styles.catLeft}>
                <View style={[styles.catDot, { backgroundColor: "#9CA3AF" }]} />
                <Text style={[styles.catName, { color: "#6B7280" }]}>
                  Unbudgeted
                </Text>
              </View>
              <View style={styles.catRight}>
                <Text style={[styles.catAmount, { color: "#6B7280" }]}>
                  {formatMoney(unbudgetedTotal)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {dayTxns.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          {dayTxns.map((t, i) => (
            <View
              key={t.transaction_id}
              style={[styles.txnRow, i === 0 && localStyles.txnRowFirst]}
            >
              <View style={styles.txnLeft}>
                <Text style={styles.txnName} numberOfLines={1}>
                  {t.merchant_name || t.name || "Unknown"}
                </Text>
                <Text style={styles.txnCat} numberOfLines={1}>
                  {getPrimaryLabel(t)}
                </Text>
              </View>
              <Text style={styles.txnAmount}>{formatMoney(t.amount)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
  statWarn: { color: "#C62828" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  txnRowFirst: { borderTopWidth: 0 },
});
