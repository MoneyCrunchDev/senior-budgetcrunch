import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";
import { colors, fontSize, fontWeight, radius, spacing } from "@/theme";

export default function Screen() {
  const { signout } = useAuth();
  const { syncing, syncAndRefresh } = useTransactions();
  const [syncDoneShown, setSyncDoneShown] = useState(false);

  useEffect(() => {
    if (!syncDoneShown) return;
    const t = setTimeout(() => setSyncDoneShown(false), 2000);
    return () => clearTimeout(t);
  }, [syncDoneShown]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>App Settings</Text>

      {/* Sync transactions — backup when pull-to-refresh isn't available */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            if (syncing) return;
            setSyncDoneShown(false);
            syncAndRefresh().then(() => setSyncDoneShown(true));
          }}
          disabled={syncing}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.rowText, syncing && styles.syncDisabled]}
            numberOfLines={1}
          >
            {syncing ? "Syncing…" : syncDoneShown ? "Done" : "Sync transactions"}
          </Text>
          {syncing ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <Text style={styles.chevron}>›</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={signout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  container: {
    flexGrow: 1,
    padding: spacing.md,
    paddingTop: spacing.xxxl,
    backgroundColor: colors.screenBackground,
  },

  title: {
    fontSize: fontSize.heroSm,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  row: {
    height: spacing.xxl + spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },

  syncDisabled: {
    color: colors.textPlaceholder,
  },

  chevron: {
    fontSize: 22,
    color: colors.textPlaceholder,
  },

  logoutText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
});
