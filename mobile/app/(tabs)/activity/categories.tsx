import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const GRID = 8;

type Category = {
  id: string;
  name: string;
  spent: number;
  budget: number;
};

const SAMPLE_CATEGORIES: Category[] = [
  { id: "1", name: "Groceries", spent: 72, budget: 120 },
  { id: "2", name: "Transportation", spent: 35, budget: 60 },
  { id: "3", name: "Entertainment", spent: 48, budget: 80 },
  { id: "4", name: "Dining Out", spent: 64, budget: 90 },
  { id: "5", name: "Shopping", spent: 25, budget: 100 },
];

function formatMoney(value: number): string {
  return `$${value}`;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function CategoryCard({ category }: { category: Category }) {
  const progress = clamp01(category.spent / category.budget);
  const percent = Math.round(progress * 100);
  const remaining = Math.max(category.budget - category.spent, 0);

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{category.name}</Text>
          <Text style={styles.cardSubtitle}>This Week</Text>
        </View>

        <TouchableOpacity style={styles.editButton} activeOpacity={0.85}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.spentText}>{formatMoney(category.spent)} spent</Text>
        <Text style={styles.budgetText}>
          {formatMoney(category.budget)} budget
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.remainingText}>
          {formatMoney(remaining)} remaining
        </Text>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>
    </View>
  );
}

export default function Screen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>

        <TouchableOpacity style={styles.addButton} activeOpacity={0.85}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Weekly Budgets</Text>

      <View style={styles.list}>
        {SAMPLE_CATEGORIES.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>Manage Categories</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: GRID * 2, // 16
    paddingTop: GRID * 6, // 48
    paddingBottom: GRID * 4, // 32
    backgroundColor: "#F6F7F9",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: GRID * 3, // 24
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },

  addButton: {
    height: GRID * 5, // 40
    paddingHorizontal: GRID * 2, // 16
    borderRadius: GRID, // 8
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: GRID * 2, // 16
  },

  list: {
    gap: GRID * 2, // 16
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: GRID * 1.5, // 12
    padding: GRID * 2, // 16
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: GRID * 2, // 16
  },

  cardTitleWrap: {
    flex: 1,
    marginRight: GRID * 2, // 16
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: GRID / 2, // 4
  },

  cardSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  editButton: {
    height: GRID * 4, // 32
    paddingHorizontal: GRID * 1.5, // 12
    borderRadius: GRID, // 8
    backgroundColor: "#F8F9FB",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
    justifyContent: "center",
  },

  editButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: GRID, // 8
  },

  spentText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  budgetText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },

  progressTrack: {
    height: GRID * 1.5, // 12
    borderRadius: GRID,
    backgroundColor: "#E9EDF2",
    overflow: "hidden",
    marginBottom: GRID, // 8
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2ECC71",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  remainingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  percentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },

  bottomActions: {
    marginTop: GRID * 3, // 24
  },

  secondaryButton: {
    height: GRID * 6, // 48
    borderRadius: GRID, // 8
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8DCE2",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
});