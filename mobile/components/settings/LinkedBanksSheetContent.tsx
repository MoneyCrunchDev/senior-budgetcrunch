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
import { colors, fontSize, fontWeight, radius, spacing } from "@/theme";

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
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: spacing.xl }}
        />
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
              <Text style={[styles.itemLabel, { marginTop: spacing.xs }]}>
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
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankTitle: {
    fontSize: 17,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  linkedMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  itemLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginTop: 2,
  },
  itemIdMuted: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.textPlaceholder,
    marginTop: 2,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.danger,
    textAlign: "center",
    paddingVertical: spacing.xs,
  },
  addButton: {
    height: spacing.xxl + spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  addButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
