/**
 * Content for the "Linked Bank Accounts" bottom sheet.
 * Renders inside ModalBottomSheet from Account settings.
 * Uses BottomSheetScrollView so scrolling works correctly with the sheet gestures.
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getLinkedItems, type LinkedItem } from "@/lib/plaidApi";

const GRID = 8;

export type LinkedBanksSheetContentProps = {
  /** Called when the sheet should close (e.g. before navigating to bank-connect). */
  onClose?: () => void;
};

export default function LinkedBanksSheetContent({
  onClose,
}: LinkedBanksSheetContentProps) {
  const { user } = useAuth();
  const userId = user?.$id ?? null;

  const [items, setItems] = useState<LinkedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const linked = await getLinkedItems(userId);
        if (!cancelled) setItems(linked);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleAddAnotherBank = () => {
    onClose?.();
    router.push("/(banking)/bank-connect");
  };

  return (
    <BottomSheetScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Linked Bank Accounts</Text>

      {loading && (
        <ActivityIndicator size="large" style={{ marginTop: GRID * 4 }} />
      )}

      {!loading && error && (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && items.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.emptyText}>No bank accounts linked yet.</Text>
        </View>
      )}

      {!loading &&
        !error &&
        items.map((item, idx) => {
          const title =
            item.institutionName?.trim() || "Linked account";
          return (
            <View key={item.itemId ?? idx} style={styles.card}>
              <Text style={styles.bankTitle}>{title}</Text>
              {item.linkedAt ? (
                <Text style={styles.linkedMeta}>
                  Linked on {new Date(item.linkedAt).toLocaleDateString()}
                </Text>
              ) : null}
              <Text style={[styles.itemLabel, { marginTop: GRID }]}>
                Connection ID
              </Text>
              <Text style={styles.itemIdMuted} selectable>
                {item.itemId}
              </Text>
            </View>
          );
        })}

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddAnotherBank}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>+ Add Another Bank Account</Text>
      </TouchableOpacity>
    </BottomSheetScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: GRID * 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: GRID * 3,
    color: "#111",
  },
  card: {
    backgroundColor: "#F6F7F9",
    borderRadius: GRID * 1.5,
    padding: GRID * 2,
    marginBottom: GRID * 2,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  bankTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },
  linkedMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#222",
    marginTop: 2,
  },
  itemIdMuted: {
    fontSize: 12,
    fontWeight: "400",
    color: "#999",
    marginTop: 2,
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    paddingVertical: GRID * 2,
  },
  errorText: {
    fontSize: 15,
    color: "#D32F2F",
    textAlign: "center",
    paddingVertical: GRID,
  },
  addButton: {
    height: GRID * 7,
    borderRadius: GRID,
    backgroundColor: "#2ECC71",
    alignItems: "center",
    justifyContent: "center",
    marginTop: GRID * 2,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
