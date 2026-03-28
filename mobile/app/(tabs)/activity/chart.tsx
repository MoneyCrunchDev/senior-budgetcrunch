import { useActivityCategories } from "@/context/ActivityCategoriesContext";
import React, { useMemo } from "react";
import { ActivityIndicator, Text, ScrollView, StyleSheet, View } from "react-native";
import PieChart from "react-native-pie-chart";

const GRID = 8;

function formatMoney(value: number): string {
  return `$${value}`;
}

export default function Screen() {
  const { categories, ready } = useActivityCategories();
  const widthAndHeight = GRID * 24; // 192

  const { series, totalSpent, sortedData } = useMemo(() => {
    const total = categories.reduce((sum, item) => sum + item.spent, 0);
    const ser = categories.map((item) => ({
      value: Math.max(item.spent, 0),
      color: item.color,
    }));
    const sorted = [...categories].sort((a, b) => b.spent - a.spent);
    return { series: ser, totalSpent: total, sortedData: sorted };
  }, [categories]);

  if (!ready) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  const showChart = categories.length > 0 && totalSpent > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Spending Breakdown</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Category Spending</Text>

        {categories.length === 0 ? (
          <Text style={styles.emptyHint}>
            Add categories on the Categories tab to see your breakdown here.
          </Text>
        ) : !showChart ? (
          <View style={styles.emptyChartBlock}>
            <Text style={styles.emptyHint}>
              No spending recorded yet. Edit amounts under Categories.
            </Text>
            <View style={styles.placeholderTotals}>
              <Text style={styles.chartCenterAmount}>{formatMoney(0)}</Text>
              <Text style={styles.chartCenterLabel}>This Week</Text>
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
              <Text style={styles.chartCenterLabel}>This Week</Text>
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
        <Text style={styles.cardTitle}>Weekly Summary</Text>

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
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7F9",
  },

  emptyHint: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: GRID * 2,
    paddingHorizontal: GRID,
  },

  emptyChartBlock: {
    paddingVertical: GRID * 2,
    marginBottom: GRID * 2,
  },

  placeholderTotals: {
    alignSelf: "center",
    width: GRID * 11,
    height: GRID * 11,
    borderRadius: GRID * 5.5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
    justifyContent: "center",
    marginTop: GRID,
  },

  container: {
    paddingHorizontal: GRID * 2, // 16
    paddingTop: GRID * 6, // 48
    paddingBottom: GRID * 4, // 32
    backgroundColor: "#F6F7F9",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: GRID * 3, // 24
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: GRID * 1.5, // 12
    padding: GRID * 2, // 16
    borderWidth: 1,
    borderColor: "#E6E8EC",
    marginBottom: GRID * 2, // 16
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: GRID * 2, // 16
  },

  chartWrapper: {
    width: GRID * 24, // 192
    height: GRID * 24, // 192
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: GRID * 3, // 24
    position: "relative",
  },

  chartCenter: {
    position: "absolute",
    width: GRID * 11, // 88
    height: GRID * 11, // 88
    borderRadius: GRID * 5.5, // 44
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  chartCenterAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    marginBottom: GRID / 2, // 4
  },

  chartCenterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  legend: {
    gap: GRID * 1.5, // 12
  },

  legendRow: {
    minHeight: GRID * 6, // 48
    borderWidth: 1,
    borderColor: "#E6E8EC",
    borderRadius: GRID, // 8
    paddingHorizontal: GRID * 2, // 16
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },

  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: GRID * 2, // 16
  },

  legendDot: {
    width: GRID * 1.5, // 12
    height: GRID * 1.5, // 12
    borderRadius: GRID, // 8
    marginRight: GRID * 1.5, // 12
  },

  legendLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },

  legendRight: {
    alignItems: "flex-end",
  },

  legendAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  legendPercent: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: GRID / 2, // 4
  },

  summaryRow: {
    minHeight: GRID * 6, // 48
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F4",
  },

  summaryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
});