import { useActivityCategories } from "@/context/ActivityCategoriesContext";
import { colors, fontSize, fontWeight, radius, spacing } from "@/theme";
import React, { useMemo } from "react";
import { ActivityIndicator, Text, ScrollView, StyleSheet, View } from "react-native";
import PieChart from "react-native-pie-chart";

const CHART_SIZE = 192;
const CHART_CENTER_SIZE = 88;

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function Screen() {
  const { categories, ready } = useActivityCategories();
  const widthAndHeight = CHART_SIZE;

  const { series, totalSpent, sortedData } = useMemo(() => {
    const total = categories.reduce((sum, item) => sum + item.spent, 0);
    const ser = categories.map((item) => ({
      value: Math.max(item.spent, 0.01),
      color: item.color,
    }));
    const sorted = [...categories].sort((a, b) => b.spent - a.spent);
    return { series: ser, totalSpent: total, sortedData: sorted };
  }, [categories]);

  if (!ready) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const showChart = categories.length > 0 && totalSpent > 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Spending Breakdown</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Category Spending</Text>

        {categories.length === 0 ? (
          <Text style={styles.emptyHint}>
            No transactions yet. Link a bank account and sync to see your
            spending breakdown here.
          </Text>
        ) : !showChart ? (
          <View style={styles.emptyChartBlock}>
            <Text style={styles.emptyHint}>
              No outgoing spending recorded yet.
            </Text>
            <View style={styles.placeholderTotals}>
              <Text style={styles.chartCenterAmount}>{formatMoney(0)}</Text>
              <Text style={styles.chartCenterLabel}>Total</Text>
            </View>
          </View>
        ) : (
          <View style={styles.chartWrapper}>
            <PieChart
              widthAndHeight={widthAndHeight}
              series={series}
              cover={0.45}
            />

            <View style={styles.chartCenter}>
              <Text style={styles.chartCenterAmount}>
                {formatMoney(totalSpent)}
              </Text>
              <Text style={styles.chartCenterLabel}>Total Spent</Text>
            </View>
          </View>
        )}

        {categories.length > 0 && (
          <View style={styles.legend}>
            {sortedData.map((item) => {
              const pct =
                totalSpent > 0
                  ? Math.round((item.spent / totalSpent) * 100)
                  : 0;

              return (
                <View key={item.id} style={styles.legendRow}>
                  <View style={styles.legendLeft}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.legendLabel}>{item.name}</Text>
                  </View>

                  <View style={styles.legendRight}>
                    <Text style={styles.legendAmount}>
                      {formatMoney(item.spent)}
                    </Text>
                    <Text style={styles.legendPercent}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryValue}>{formatMoney(totalSpent)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Top Category</Text>
          <Text style={styles.summaryValue}>
            {totalSpent > 0 ? (sortedData[0]?.name ?? "-") : "-"}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Categories</Text>
          <Text style={styles.summaryValue}>{categories.length}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.screenBackground,
  },

  emptyHint: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },

  emptyChartBlock: {
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },

  placeholderTotals: {
    alignSelf: "center",
    width: CHART_CENTER_SIZE,
    height: CHART_CENTER_SIZE,
    borderRadius: CHART_CENTER_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.screenBackground,
  },

  title: {
    fontSize: fontSize.heroSm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  chartWrapper: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    position: "relative",
  },

  chartCenter: {
    position: "absolute",
    width: CHART_CENTER_SIZE,
    height: CHART_CENTER_SIZE,
    borderRadius: CHART_CENTER_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  chartCenterAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },

  chartCenterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },

  legend: {
    gap: spacing.sm,
  },

  legendRow: {
    minHeight: spacing.xxl - spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
  },

  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.md,
  },

  legendDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.md,
    marginRight: spacing.sm,
  },

  legendLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },

  legendRight: {
    alignItems: "flex-end",
  },

  legendAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  legendPercent: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },

  summaryRow: {
    minHeight: spacing.xxl - spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  summaryLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },

  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});