import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { WeekInsight } from "./sheetTypes";
import { sheetContentStyles as styles } from "./sheetContentStyles";
import { formatDateShort, formatMoney, STATUS_META } from "./sheetUtils";

type Props = {
  insight: WeekInsight;
};

export default function CalendarWeekSheetContent({ insight }: Props) {
  const meta = STATUS_META[insight.status];
  const overCats = insight.categoryRows.filter((r) => r.isOver);
  const worstCat =
    overCats.length > 0
      ? overCats.reduce((a, b) =>
          b.spent - b.weeklyBudget > a.spent - a.weeklyBudget ? b : a
        )
      : null;
  return (
    <View>
      <View style={styles.sheetHero}>
        <View style={styles.sheetHeaderRow}>
          <Text style={styles.sheetHeaderTitle}>{insight.rangeLabel}</Text>
          <View style={[styles.weekBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.weekBadgeText, { color: meta.fg }]}>
              {meta.label}
            </Text>
          </View>
        </View>

        <Text style={styles.sheetHeroMuted}>{meta.shortExplanation}</Text>

        <Text style={styles.sheetTotalMain}>{formatMoney(insight.spent)}</Text>
        <Text style={styles.sheetTotalSub}>
          of {formatMoney(insight.weeklyBudget)} weekly target
        </Text>

        {insight.redCount > 0 ? (
          <Text style={[styles.sheetHeroMuted, localStyles.weekMetricsLine]}>
            {insight.redCount}{" "}
            {insight.redCount === 1 ? "day" : "days"} over daily limit
          </Text>
        ) : null}

        {insight.redDayDates.length > 0 ? (
          <View style={styles.overInlineRow}>
            <Text style={styles.overInlineLabel}>On:</Text>
            {insight.redDayDates.map((d) => (
              <View key={d} style={styles.overrunChip}>
                <Text style={styles.overrunChipText}>{formatDateShort(d)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {worstCat ? (
          <View style={localStyles.heroFooterCallout}>
            <Ionicons name="trending-up" size={18} color="#C62828" />
            <View style={styles.insightCalloutBody}>
              <Text style={styles.insightCalloutLabel}>Largest weekly overrun</Text>
              <Text style={styles.insightCalloutValue} numberOfLines={2}>
                {worstCat.name}: {formatMoney(worstCat.spent)} vs.{" "}
                {formatMoney(worstCat.weeklyBudget)} target
              </Text>
            </View>
          </View>
        ) : insight.redCount === 0 ? (
          <View style={localStyles.heroFooterCallout}>
            <Ionicons name="checkmark-circle" size={18} color="#1B5E20" />
            <View style={styles.insightCalloutBody}>
              <Text style={styles.insightCalloutLabel}>Weekly pacing</Text>
              <Text style={styles.insightCalloutValue}>
                No daily target misses in this 7-day window.
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {insight.categoryRows.length > 0 ? (
        <View style={styles.listBlock}>
          <View style={styles.listBlockHeaderRow}>
            <Text style={[styles.listBlockTitle, styles.listBlockTitleInline]}>
              By category
            </Text>
            <Text
              style={[
                styles.listBlockHeaderMeta,
                overCats.length > 0
                  ? styles.listBlockHeaderMetaWarn
                  : undefined,
              ]}
            >
              {overCats.length}{" "}
              {overCats.length === 1 ? "category" : "categories"} over weekly
              target
            </Text>
          </View>
          {insight.categoryRows.map((row) => {
            const pct =
              row.weeklyBudget > 0
                ? Math.min(100, (row.spent / row.weeklyBudget) * 100)
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
                      / {formatMoney(row.weeklyBudget)}
                    </Text>
                  </View>
                </View>
                {row.weeklyBudget > 0 ? (
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

          {insight.unbudgetedTotal > 0 ? (
            <View style={[styles.catBlock, localStyles.catBlockLast]}>
              <View style={styles.catBlockTop}>
                <View style={styles.catLeft}>
                  <View style={[styles.catDot, { backgroundColor: "#9CA3AF" }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.catName, { color: "#6B7280" }]}>
                      Other spend
                    </Text>
                    <Text style={localStyles.catSubLabel}>
                      Plaid categories where you have not set a monthly budget in
                      Activity
                    </Text>
                  </View>
                </View>
                <Text style={[styles.catAmount, { color: "#6B7280" }]}>
                  {formatMoney(insight.unbudgetedTotal)}
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.listBlockFoot}>
            Weekly target = monthly budget ÷ days this month × 7 (per category).
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
  weekMetricsLine: {
    marginTop: 8,
    marginBottom: 4,
  },
  heroFooterCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D1D5DB",
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
