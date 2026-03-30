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

  let statusLine: string | null = null;
  if (totalSpent === 0) {
    statusLine = "No outflows on this day.";
  } else if (hasBudg && isRedDay) {
    statusLine =
      "At least one budgeted category went over its share of today’s monthly budget.";
  } else if (hasBudg && !isRedDay) {
    statusLine =
      "Every budgeted category stayed within its share of today’s monthly budget.";
  }

  return (
    <View>
      <View style={styles.sheetHero}>
        <View style={styles.sheetHeaderRow}>
          <Text style={styles.sheetHeaderTitle}>{formatDateNice(dateStr)}</Text>
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
                {isRedDay ? "Over daily target" : "Within daily target"}
              </Text>
            </View>
          ) : null}
        </View>

        {statusLine ? (
          <Text style={styles.sheetHeroMuted}>{statusLine}</Text>
        ) : null}

        <Text
          style={[
            styles.sheetTotalMain,
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
          {formatMoney(totalSpent)}
        </Text>
        <Text style={styles.sheetTotalSub}>total spent</Text>

        {worstCat ? (
          <View style={localStyles.heroFooterCallout}>
            <Ionicons name="trending-up" size={18} color="#C62828" />
            <View style={styles.insightCalloutBody}>
              <Text style={styles.insightCalloutLabel}>Largest gap today</Text>
              <Text style={styles.insightCalloutValue} numberOfLines={2}>
                {worstCat.name}: {formatMoney(worstCat.spent)} vs.{" "}
                {formatMoney(worstCat.dailyBudget)} daily target
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {dayTxns.length > 0 ? (
        <View style={styles.listBlock}>
          <View style={styles.listBlockHeaderRow}>
            <Text style={[styles.listBlockTitle, styles.listBlockTitleInline]}>
              Purchases
            </Text>
            <Text style={styles.listBlockHeaderMeta}>
              {dayTxns.length}{" "}
              {dayTxns.length === 1 ? "item" : "items"}
            </Text>
          </View>
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

      {!hasBudg && totalSpent > 0 ? (
        <View style={styles.listBlock}>
          <View style={localStyles.infoRow}>
            <Ionicons name="information-circle" size={18} color="#6B7280" />
            <Text style={styles.sectionHint}>
              Set monthly budgets in Activity → Categories to see daily targets
              here.
            </Text>
          </View>
        </View>
      ) : null}

      {hasBudg && budgetedRows.length > 0 ? (
        <View style={styles.listBlock}>
          <View style={styles.listBlockHeaderRow}>
            <Text style={[styles.listBlockTitle, styles.listBlockTitleInline]}>
              Daily budget by category
            </Text>
            {overRows.length > 0 ? (
              <Text
                style={[
                  styles.listBlockHeaderMeta,
                  styles.listBlockHeaderMetaWarn,
                ]}
              >
                {overRows.length}{" "}
                {overRows.length === 1 ? "category" : "categories"} over
              </Text>
            ) : totalSpent > 0 ? (
              <Text
                style={[styles.listBlockHeaderMeta, styles.listBlockHeaderMetaOk]}
              >
                All on track
              </Text>
            ) : null}
          </View>
          {budgetedRows.map((row) => {
            const pct =
              row.dailyBudget > 0
                ? Math.min(100, (row.spent / row.dailyBudget) * 100)
                : 0;
            const spentColor =
              row.isOver
                ? "#FF3B30"
                : row.spent <= 0
                  ? "#111827"
                  : "#34C759";
            const barColor = row.isOver ? "#FF3B30" : "#34C759";
            return (
              <View key={row.slug} style={styles.catBlock}>
                <View style={styles.catBlockTop}>
                  <View style={styles.catLeft}>
                    <View style={[styles.catDot, { backgroundColor: row.color }]} />
                    <Text style={styles.catName} numberOfLines={1}>
                      {row.name}
                    </Text>
                  </View>
                  <View style={styles.catRight}>
                    <Text style={[styles.catAmount, { color: spentColor }]}>
                      {formatMoney(row.spent)}
                    </Text>
                    <Text style={styles.catBudget}>
                      / {formatMoney(row.dailyBudget)}
                    </Text>
                  </View>
                </View>
                {row.dailyBudget > 0 ? (
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${pct}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}

          {unbudgetedTotal > 0 ? (
            <View style={[styles.catBlock, localStyles.catBlockLast]}>
              <View style={styles.catBlockTop}>
                <View style={styles.catLeft}>
                  <View style={[styles.catDot, { backgroundColor: "#9CA3AF" }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.catName, { color: "#6B7280" }]}>
                      Other spend
                    </Text>
                    <Text style={localStyles.catSubLabel}>
                      In Plaid categories where you have not set a monthly budget
                    </Text>
                  </View>
                </View>
                <Text style={[styles.catAmount, { color: "#6B7280" }]}>
                  {formatMoney(unbudgetedTotal)}
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.listBlockFoot}>
            Daily target = that category’s monthly budget ÷ days this month.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
  heroFooterCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D1D5DB",
  },
  txnRowFirst: { borderTopWidth: 0 },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  catBlockLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  catSubLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    lineHeight: 15,
    marginTop: 2,
    fontWeight: "500",
  },
});
