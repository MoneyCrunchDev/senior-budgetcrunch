import { useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import LinkedBanksSheetContent from "@/components/settings/LinkedBanksSheetContent";
import ModalBottomSheet from "@/components/ModalBottomSheet";

const GRID = 8;

export default function Screen() {
  const linkedBanksSheetRef = useRef<BottomSheet>(null);
  const linkedBanksSnapPoints = useMemo(() => ["60%"], []);

  const openLinkedBanksSheet = () => {
    requestAnimationFrame(() => {
      linkedBanksSheetRef.current?.snapToIndex(0);
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Account Settings</Text>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput placeholder="Enter your name" style={styles.input} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            placeholder="Enter your phone number"
            style={styles.input}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Save — scoped to Personal Information above */}
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Save Changes</Text>
      </TouchableOpacity>

      {/* Banking */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Banking</Text>

        <TouchableOpacity
          style={styles.rowButton}
          onPress={openLinkedBanksSheet}
        >
          <Text style={styles.rowButtonText}>View Linked Bank Info</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rowButton}
          onPress={() => router.push("/(banking)/bank-connect")}
        >
          <Text style={styles.rowButtonText}>Add Another Bank Account</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <ModalBottomSheet
        ref={linkedBanksSheetRef}
        snapPoints={linkedBanksSnapPoints}
      >
        <LinkedBanksSheetContent
          onClose={() => linkedBanksSheetRef.current?.close()}
        />
      </ModalBottomSheet>
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
    padding: GRID * 2, // 16
    marginBottom: GRID * 2, // 16
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: GRID * 2, // 16
    color: "#111",
  },

  field: {
    marginBottom: GRID * 2, // 16
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: GRID, // 8
    color: "#333",
  },

  input: {
    height: GRID * 6, // 48
    borderWidth: 1,
    borderColor: "#D8DCE2",
    borderRadius: GRID, // 8
    paddingHorizontal: GRID * 1.5, // 12
    fontSize: 16,
    backgroundColor: "#FFF",
  },

  rowButton: {
    height: GRID * 6, // 48
    borderWidth: 1,
    borderColor: "#E6E8EC",
    borderRadius: GRID, // 8
    paddingHorizontal: GRID * 2, // 16
    marginBottom: GRID * 1.5, // 12
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },

  chevron: {
    fontSize: 22,
    color: "#999",
    marginLeft: GRID, // 8
    lineHeight: 22,
  },

  primaryButton: {
    height: GRID * 7, // 56
    borderRadius: GRID, // 8
    backgroundColor: "#2ECC71",
    alignItems: "center",
    justifyContent: "center",
    marginTop: GRID, // 8
    marginBottom: GRID * 3, // 24 (extra scroll padding)
  },

  primaryButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
});