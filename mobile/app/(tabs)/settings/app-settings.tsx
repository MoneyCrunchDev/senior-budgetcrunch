import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";

const GRID = 8;

export default function Screen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>App Settings</Text>

      {/* Notifications */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowText}>Notifications</Text>

          <Switch
            value={notificationsEnabled}
            onValueChange={() => setNotificationsEnabled(!notificationsEnabled)}
          />
        </View>
      </View>

      {/* Support */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Contact Support</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.row}>
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