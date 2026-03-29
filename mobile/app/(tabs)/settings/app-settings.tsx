import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";

const GRID = 8;

export default function Screen() {
  const { signout } = useAuth();
  const { syncing, syncAndRefresh } = useTransactions();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [syncDoneShown, setSyncDoneShown] = useState(false);

  useEffect(() => {
    if (!syncDoneShown) return;
    const t = setTimeout(() => setSyncDoneShown(false), 2000);
    return () => clearTimeout(t);
  }, [syncDoneShown]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>App Settings</Text>

      {/* Notifications */}
      {/* <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowText}>Notifications</Text>

          <Switch
            value={notificationsEnabled}
            onValueChange={() => setNotificationsEnabled(!notificationsEnabled)}
          />
        </View>
      </View> */}

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
            <ActivityIndicator size="small" color="#666" />
          ) : (
            <Text style={styles.chevron}>›</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Support */}
      {/* <View style={styles.card}>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Contact Support</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View> */}

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
  container: {
    padding: GRID * 2, // 16
    paddingTop: GRID * 6, // 48
    backgroundColor: "#F6F7F9",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: GRID * 3, // 24
    color: "#111",
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: GRID * 1.5, // 12
    paddingHorizontal: GRID * 2, // 16
    marginBottom: GRID * 2, // 16
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },

  row: {
    height: GRID * 7, // 56
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },

  syncDisabled: {
    color: "#999",
  },

  chevron: {
    fontSize: 22,
    color: "#999",
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E53935",
  },
});