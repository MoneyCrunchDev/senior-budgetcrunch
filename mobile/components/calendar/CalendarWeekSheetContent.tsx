import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { WeekInsight } from "./sheetTypes";
import { sheetContentStyles as styles } from "./sheetContentStyles";
import { formatDateNice, formatMoney, STATUS_META } from "./sheetUtils";

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
  const greenCount = 7 - insight.redCount;

  return (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={[styles.heroIconWrap, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={20} color={meta.fg} />
          </View>
          <View style={[styles.weekBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.weekBadgeText, { color: meta.fg }]}>
              {meta.label}
            </Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>{insight.rangeLabel}</Text>
        <Text style={styles.heroExplainer}>{meta.explanation}</Text>

        <Text style={styles.heroTotal}>
          {formatMoney(insight.spent)}{" "}
          <Text style={styles.heroTotalSuffix}>
            of {formatMoney(insight.weeklyBudget)} weekly budget
          </Text>
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillValue}>{greenCount}</Text>
            <Text style={styles.statPillLabel}>
              good day{greenCount !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.statPill}>
            <Text
              style={[
                styles.statPillValue,
                insight.redCount > 0 && localStyles.statWarn,
              ]}
            >
              {insight.redCount}
            </Text>
            <Text style={styles.statPillLabel}>
              over day{insight.redCount !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillValue}>{overCats.length}</Text>
            <Text style={styles.statPillLabel}>
              cat{overCats.length !== 1 ? "s" : ""} over
            </Text>
          </View>
        </View>

        {worstCat ? (
          <View style={styles.insightCallout}>
            <Ionicons name="trending-up" size={18} color="#C62828" />
            <View style={styles.insightCalloutBody}>
              <Text style={styles.insightCalloutLabel}>Biggest overrun</Text>
              <Text style={styles.insightCalloutValue} numberOfLines={1}>
                {worstCat.name}: {formatMoney(worstCat.spent)} spent vs.{" "}
                {formatMoney(worstCat.weeklyBudget)} target
              </Text>
            </View>
          </View>
        ) : null}

        {insight.redCount === 0 ? (
          <View style={styles.insightCallout}>
            <Ionicons name="checkmark-circle" size={18} color="#1B5E20" />
            <View style={styles.insightCalloutBody}>
              <Text style={styles.insightCalloutLabel}>Pacing</Text>
              <Text style={styles.insightCalloutValue}>
                All 7 days within daily category targets!
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {insight.redDayDates.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Days with category overruns</Text>
          <Text style={styles.sectionHint}>
            These days had at least one category exceed its daily target.
          </Text>
          {insight.redDayDates.map((d) => (
            <View key={d} style={styles.redDayRow}>
              <Ionicons name="close-circle" size={16} color="#C62828" />
              <Text style={styles.redDayItem}>{formatDateNice(d)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {insight.categoryRows.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <Text style={styles.sectionHint}>
            Weekly target = your monthly budget for each category, divided evenly
            across the month, then multiplied by 7 days.
          </Text>
          {insight.categoryRows.map((row) => (
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
                  / {formatMoney(row.weeklyBudget)}
                </Text>
              </View>
            </View>
          ))}

          {insight.unbudgetedTotal > 0 ? (
            <View style={styles.catRow}>
              <View style={styles.catLeft}>
                <View style={[styles.catDot, { backgroundColor: "#9CA3AF" }]} />
                <Text style={[styles.catName, { color: "#6B7280" }]}>
                  Unbudgeted
                </Text>
              </View>
              <View style={styles.catRight}>
                <Text style={[styles.catAmount, { color: "#6B7280" }]}>
                  {formatMoney(insight.unbudgetedTotal)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
  statWarn: { color: "#C62828" },
});
