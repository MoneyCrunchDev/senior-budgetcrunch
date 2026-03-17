import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import ModalBottomSheet from "@/components/ModalBottomSheet";
import {
  getLinkedItems,
  getTransactions,
  syncTransactions,
  type LinkedItem,
  type Transaction,
} from "@/lib/plaidApi";

const GRID = 8;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDateMonthDay(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "Z");
  if (Number.isNaN(d.getTime())) return dateStr;
  const month = MONTHS[d.getUTCMonth()];
  const day = d.getUTCDate();
  return `${month} ${day}`;
}

/** Plaid: positive = outflow, negative = inflow. Display: outflow = -, inflow = +. */
function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  if (amount > 0) return `-$${abs.toFixed(2)}`; // outflow
  if (amount < 0) return `+$${abs.toFixed(2)}`; // inflow
  return `$0.00`;
}

function getCategoryLabel(category: string | null): string {
  if (!category) return "Uncategorized";
  try {
    const parsed = JSON.parse(category);
    if (Array.isArray(parsed) && parsed.length) return parsed[parsed.length - 1];
    if (typeof parsed === "string") return parsed;
  } catch {
    return category;
  }
  return "Uncategorized";
}

function getCategoryLabelFull(category: string | null): string {
  if (!category) return "Uncategorized";
  try {
    const parsed = JSON.parse(category);
    if (Array.isArray(parsed) && parsed.length) return parsed.join(" › ");
    if (typeof parsed === "string") return parsed;
  } catch {
    return category;
  }
  return "Uncategorized";
}

function formatDateFull(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "Z");
  if (Number.isNaN(d.getTime())) return dateStr;
  const month = MONTHS[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

function TransactionDetailSheetContent({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const name = transaction.merchant_name || transaction.name || "Unknown";
  return (
    <>
      <TouchableOpacity onPress={onClose} style={styles.detailCloseRow}>
        <Text style={styles.detailCloseText}>Close</Text>
      </TouchableOpacity>
      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>Name</Text>
        <Text style={styles.detailValue}>{name}</Text>
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>Category</Text>
        <Text style={styles.detailValue}>{getCategoryLabelFull(transaction.category)}</Text>
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>Date</Text>
        <Text style={styles.detailValue}>{formatDateFull(transaction.date)}</Text>
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>Amount</Text>
        <Text style={[styles.detailValue, styles.detailAmount]}>
          {formatAmount(transaction.amount)}
        </Text>
      </View>
      {transaction.pending && (
        <View style={styles.detailCard}>
          <Text style={styles.detailPendingBadge}>Pending</Text>
        </View>
      )}
    </>
  );
}

export type SortOption = "recent" | "oldest" | "highest" | "lowest";

const SORT_LABELS: Record<SortOption, string> = {
  recent: "Recent",
  oldest: "Oldest",
  highest: "Highest amount",
  lowest: "Lowest amount",
};

function sortTransactions(list: Transaction[], sortBy: SortOption): Transaction[] {
  const copy = [...list];
  switch (sortBy) {
    case "recent":
      return copy.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    case "oldest":
      return copy.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    case "highest":
      return copy.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    case "lowest":
      return copy.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    default:
      return copy;
  }
}

function groupByMonth(
  transactions: Transaction[],
  sortBy: SortOption
): { month: string; transactions: Transaction[] }[] {
  const byMonth = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (!t.date) continue;
    const key = t.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(t);
  }
  // Oldest: show oldest month first (ascending). Recent/highest/lowest: newest month first (descending).
  const monthOrder = sortBy === "oldest" ? 1 : -1;
  const sorted = Array.from(byMonth.entries()).sort(
    (a, b) => monthOrder * (a[0].localeCompare(b[0]))
  );
  return sorted.map(([key, list]) => {
    const [y, m] = key.split("-");
    const monthLabel = MONTHS[Number(m) - 1] + " " + y;
    return { month: monthLabel, transactions: list };
  });
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const userId = user?.$id ?? null;

  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const hasSetInitialAccount = useRef(false);

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewAllMonths, setViewAllMonths] = useState(false);

  const detailSheetRef = useRef<BottomSheet>(null);
  const detailSheetSnapPoints = useMemo(() => ["60%"], []);

  const loadLinkedItems = useCallback(async () => {
    if (!userId) return;
    try {
      const items = await getLinkedItems(userId);
      setLinkedItems(items);
      if (items.length && !hasSetInitialAccount.current) {
        hasSetInitialAccount.current = true;
        setSelectedItemId(items[0].itemId);
      }
    } catch {
      setLinkedItems([]);
    }
  }, [userId]);

  const loadTransactions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getTransactions(userId, {
        item_id: selectedItemId ?? undefined,
        ...(viewAllMonths ? {} : { month, year }),
        limit: viewAllMonths ? 500 : 200,
      });
      setTransactions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedItemId, month, year, viewAllMonths]);

  useEffect(() => {
    loadLinkedItems();
  }, [loadLinkedItems]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setSyncing(true);
    try {
      await syncTransactions(userId);
      await loadTransactions();
    } finally {
      setSyncing(false);
    }
  }, [userId, loadTransactions]);

  const openDetail = useCallback((t: Transaction) => {
    setSelectedTransaction(t);
    requestAnimationFrame(() => {
      detailSheetRef.current?.snapToIndex(0);
    });
  }, []);

  const closeDetailSheet = useCallback(() => {
    detailSheetRef.current?.close();
    setSelectedTransaction(null);
  }, []);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthLabel = `${MONTHS[month - 1]} ${year}`;
  const accountLabel = selectedItemId === null
    ? "All accounts"
    : linkedItems.find((i) => i.itemId === selectedItemId)
      ? `Account …${selectedItemId.slice(-6)}`
      : "All accounts";

  const filteredSortedAndGrouped = useMemo(() => {
    let list = transactions;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          (t.merchant_name ?? "").toLowerCase().includes(q) ||
          (t.name ?? "").toLowerCase().includes(q)
      );
    }
    list = sortTransactions(list, sortBy);
    return groupByMonth(list, sortBy);
  }, [transactions, searchQuery, sortBy]);

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Sign in to view transactions.</Text>
      </View>
    );
  }

  if (linkedItems.length === 0 && !loading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.emptyText}>No bank accounts linked.</Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/(tabs)/settings/account")}
        >
          <Text style={styles.linkButtonText}>Link a bank in Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <>
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={syncing} onRefresh={onRefresh} />
      }
    >
      {/* 1. Account — full width, 8-grid */}
      <TouchableOpacity
        style={styles.accountRow}
        onPress={() => setShowAccountPicker(!showAccountPicker)}
        activeOpacity={0.7}
      >
        <Text style={styles.accountLabel} numberOfLines={1}>
          {accountLabel}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#666" />
      </TouchableOpacity>

      {showAccountPicker && (
        <View style={styles.pickerDropdown}>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => {
              setSelectedItemId(null);
              setShowAccountPicker(false);
            }}
          >
            <Text style={styles.pickerRowText}>All accounts</Text>
          </TouchableOpacity>
          {linkedItems.map((item) => (
            <TouchableOpacity
              key={item.itemId}
              style={styles.pickerRow}
              onPress={() => {
                setSelectedItemId(item.itemId);
                setShowAccountPicker(false);
              }}
            >
              <Text style={styles.pickerRowText}>
                Account …{item.itemId.slice(-6)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 2. Month — toggle All | By month; when By month, show chevrons + month */}
      <View style={styles.monthRow}>
        <View style={styles.toggleWrap}>
          <TouchableOpacity
            style={[styles.toggleOption, viewAllMonths && styles.toggleOptionActive]}
            onPress={() => setViewAllMonths(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, viewAllMonths && styles.toggleTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, !viewAllMonths && styles.toggleOptionActive]}
            onPress={() => setViewAllMonths(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, !viewAllMonths && styles.toggleTextActive]}>
              By month
            </Text>
          </TouchableOpacity>
        </View>

        {!viewAllMonths && (
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
              <Ionicons name="chevron-back" size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
              <Ionicons name="chevron-forward" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 3. Sort + Search — one card, one row, 8-grid */}
      <View style={styles.controlsCard}>
        <TouchableOpacity
          style={styles.sortTouchable}
          onPress={() => setShowSortPicker(!showSortPicker)}
          activeOpacity={0.7}
        >
          <Text style={styles.sortLabel} numberOfLines={1}>
            {SORT_LABELS[sortBy]}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
        </View>
      </View>

      {showSortPicker && (
        <View style={styles.pickerDropdown}>
          {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.pickerRow}
              onPress={() => {
                setSortBy(option);
                setShowSortPicker(false);
              }}
            >
              <Text style={styles.pickerRowText}>{SORT_LABELS[option]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadTransactions} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: GRID * 4 }} />
      ) : filteredSortedAndGrouped.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? "No transactions match your search."
              : viewAllMonths
                ? "No transactions in your history."
                : "No transactions for this month."}
          </Text>
          <Text style={styles.emptyHint}>
            {searchQuery.trim()
              ? "Try a different search."
              : "Pull down to sync, or link a bank in Settings."}
          </Text>
        </View>
      ) : (
        filteredSortedAndGrouped.map(({ month: monthTitle, transactions: list }) => (
          <View key={monthTitle} style={styles.section}>
            {viewAllMonths && (
              <>
                <Text style={styles.sectionMonth}>{monthTitle}</Text>
                <View style={styles.dashedLine} />
              </>
            )}
            {list.map((t) => (
              <TouchableOpacity
                key={t.transaction_id}
                style={styles.row}
                onPress={() => openDetail(t)}
                activeOpacity={0.7}
              >
                <View style={styles.rowIcon}>
                  <Ionicons name="receipt-outline" size={22} color="#444" />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {t.merchant_name || t.name || "Unknown"}
                  </Text>
                  <Text style={styles.rowCategory}>
                    {getCategoryLabel(t.category)}
                  </Text>
                  <Text style={styles.rowDate}>
                    {formatDateMonthDay(t.date)}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>
                    {formatAmount(t.amount)}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}
    </ScrollView>

    <ModalBottomSheet
      ref={detailSheetRef}
      snapPoints={detailSheetSnapPoints}
      onClose={closeDetailSheet}
    >
      {selectedTransaction ? (
        <TransactionDetailSheetContent
          transaction={selectedTransaction}
          onClose={closeDetailSheet}
        />
      ) : null}
    </ModalBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: GRID * 2,
    paddingTop: GRID * 2,
    backgroundColor: "#F6F7F9",
    paddingBottom: GRID * 6,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: GRID * 2,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    paddingVertical: GRID * 1.5,
    paddingHorizontal: GRID * 2,
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#E6E8EC",
    marginBottom: GRID * 2,
  },
  accountLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    flex: 1,
    marginRight: GRID,
  },
  pickerDropdown: {
    backgroundColor: "#FFF",
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#E6E8EC",
    marginBottom: GRID * 2,
    overflow: "hidden",
  },
  pickerRow: {
    paddingVertical: GRID * 1.5,
    paddingHorizontal: GRID * 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E8EC",
  },
  pickerRowText: {
    fontSize: 15,
    color: "#333",
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: GRID * 2,
    paddingVertical: GRID,
  },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: "#E6E8EC",
    borderRadius: GRID,
    padding: GRID / 2,
  },
  toggleOption: {
    paddingVertical: GRID,
    paddingHorizontal: GRID * 2,
    borderRadius: GRID / 2,
    minWidth: GRID * 8,
    alignItems: "center",
  },
  toggleOptionActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  toggleTextActive: {
    color: "#111",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthArrow: {
    padding: GRID,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    minWidth: GRID * 14,
    textAlign: "center",
  },
  controlsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#E6E8EC",
    padding: GRID * 2,
    marginBottom: GRID * 2,
  },
  sortTouchable: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: GRID * 2,
    paddingRight: GRID * 2,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E6E8EC",
    minWidth: GRID * 10,
  },
  sortLabel: {
    fontSize: 14,
    color: "#333",
    marginRight: GRID / 2,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F7F9",
    borderRadius: GRID,
    paddingLeft: GRID * 2,
    paddingRight: GRID,
    height: GRID * 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111",
    paddingVertical: 0,
  },
  searchIcon: {
    marginLeft: GRID / 2,
  },
  errorCard: {
    backgroundColor: "#FFF",
    padding: GRID * 2,
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#E6E8EC",
    marginBottom: GRID * 2,
  },
  errorText: {
    fontSize: 15,
    color: "#D32F2F",
    marginBottom: GRID,
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingVertical: GRID,
    paddingHorizontal: GRID * 2,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0c4a6e",
  },
  emptyCard: {
    backgroundColor: "#FFF",
    padding: GRID * 3,
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: GRID,
  },
  emptyHint: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  linkButton: {
    marginTop: GRID * 2,
    paddingVertical: GRID * 2,
    alignItems: "center",
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2ECC71",
  },
  section: {
    marginBottom: GRID * 3,
  },
  sectionMonth: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: GRID,
  },
  dashedLine: {
    borderStyle: "dashed",
    borderBottomWidth: 1,
    borderBottomColor: "#CCC",
    marginBottom: GRID,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: GRID * 1.5,
    paddingHorizontal: GRID * 2,
    marginBottom: 1,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  rowIcon: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    marginLeft: GRID,
    minWidth: 0,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  rowCategory: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  rowDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginRight: 4,
  },
  detailCloseRow: {
    marginBottom: GRID * 2,
  },
  detailCloseText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2ECC71",
  },
  detailCard: {
    backgroundColor: "#F6F7F9",
    borderRadius: GRID,
    padding: GRID * 2,
    marginBottom: GRID * 2,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#111",
    fontWeight: "500",
  },
  detailAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  detailPendingBadge: {
    fontSize: 14,
    color: "#b45309",
    fontWeight: "600",
  },
});
