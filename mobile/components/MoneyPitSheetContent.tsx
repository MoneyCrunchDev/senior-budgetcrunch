import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Transaction } from "@/lib/plaidApi";
import {
  formatTransactionAmount,
  formatTransactionDateShort,
} from "@/lib/formatTransaction";

type Props = {
  transactions: Transaction[];
  onClose: () => void;
};

function rowTitle(t: Transaction): string {
  return t.merchant_name || t.name || "Unknown";
}

function locationLabel(transactions: Transaction[]): string {
  const merchants = new Set(
    transactions.map((t) => t.merchant_name || t.name || "Unknown")
  );
  if (merchants.size === 1) return [...merchants][0];
  return `${merchants.size} merchants`;
}

function totalSpent(transactions: Transaction[]): string {
  const sum = transactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
  return `$${sum.toFixed(2)}`;
}

export default function MoneyPitSheetContent({
  transactions,
  onClose,
}: Props) {
  const label = locationLabel(transactions);
  const total = totalSpent(transactions);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={onClose} style={styles.closeRow} hitSlop={12}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={2}>
        {label}
      </Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>
          {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.summaryTotal}>{total} total</Text>
      </View>

      <BottomSheetFlatList
        data={transactions}
        keyExtractor={(item) => item.transaction_id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowName} numberOfLines={1}>
                {rowTitle(item)}
              </Text>
              <Text style={styles.rowDate}>
                {formatTransactionDateShort(item.date)}
              </Text>
            </View>
            <Text style={styles.rowAmount}>
              {formatTransactionAmount(item.amount)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 120,
  },
  closeRow: {
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  closeText: {
    fontSize: 16,
    color: "#0A6EF2",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E8EC",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E53935",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E8EC",
  },
  rowBody: {
    flex: 1,
    marginRight: 12,
  },
  rowName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  rowDate: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
});
