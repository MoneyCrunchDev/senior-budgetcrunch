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

export default function UntrackedEnvelopeSheetContent({
  transactions,
  onClose,
}: Props) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={onClose} style={styles.closeRow} hitSlop={12}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
      <Text style={styles.title}>No map location</Text>
      <Text style={styles.subtitle}>
        These transactions don’t have coordinates from your bank (common in
        Sandbox and for online purchases). Heatmap only uses spending with a
        location.
      </Text>
      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Nothing to show — all loaded transactions have map coordinates, or
            you have no transactions yet.
          </Text>
        </View>
      ) : (
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
      )}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  empty: {
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
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
