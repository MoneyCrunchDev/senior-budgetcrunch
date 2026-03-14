/**
 * Bank connect (Plaid Link) 
 *
 * Flow:
 * 1. User must be signed in (Appwrite user id = Plaid client_user_id).
 * 2. Tap "Connect bank" → POST { action: "createLinkToken", userId } → link_token.
 * 3. react-native-plaid-link-sdk: create({ token }) then open({ onSuccess, onExit }).
 *
 * Native module: requires a dev build (expo run:ios / run:android or EAS), not Expo Go.
 * After first install of react-native-plaid-link-sdk, rebuild the native app once.
 */
import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { createLinkToken, exchangePublicToken } from "@/lib/plaidApi";
import {
  create,
  open,
  dismissLink,
  LinkIOSPresentationStyle,
  LinkLogLevel,
} from "react-native-plaid-link-sdk";
import type { LinkSuccess, LinkExit } from "react-native-plaid-link-sdk";

export default function BankConnectScreen() {
  const { user, loading: authLoading } = useAuth();
  const [busy, setBusy] = useState(false);

  const userId = user?.$id ?? null;

  const onConnectBank = useCallback(async () => {
    if (!userId) {
      Alert.alert(
        "Sign in required",
        "Sign in so we can link your bank to your account."
      );
      return;
    }
    setBusy(true);
    try {
      const linkToken = await createLinkToken(userId);
      create({
        token: linkToken,
        noLoadingState: false,
        logLevel: LinkLogLevel.ERROR,
      });
      open({
        onSuccess: async (success: LinkSuccess) => {
          try {
            const result = await exchangePublicToken(userId!, success.publicToken);
            setBusy(false);
            Alert.alert(
              "Bank linked",
              `Account connected (item: ${result.item_id}).`,
              [{ text: "OK", onPress: () => router.push("/(onboarding)/review") }]
            );
          } catch (e) {
            setBusy(false);
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert("Link succeeded but exchange failed", msg);
          }
        },
        onExit: (exit: LinkExit) => {
          setBusy(false);
          dismissLink();
          if (exit.error != null) {
            Alert.alert("Link closed", exit.error.displayMessage ?? "Something went wrong.");
          }
        },
        iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
        logLevel: LinkLogLevel.ERROR,
      });
    } catch (e) {
      setBusy(false);
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert("Could not start Plaid", message);
    }
  }, [userId]);

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Connect your bank</Text>
      <Text style={styles.body}>
        We use Plaid to connect your accounts securely. You’ll sign in to your bank
        inside Plaid’s flow. Sandbox: use any test institution and credentials from
        Plaid’s docs.
      </Text>
      {!userId ? (
        <Text style={styles.warn}>Sign in first, then return here to connect.</Text>
      ) : null}
      <Pressable
        style={[styles.button, (!userId || busy) && styles.buttonDisabled]}
        onPress={onConnectBank}
        disabled={!userId || busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Connect bank</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>
        Requires a development build (not Expo Go) after adding the Plaid native SDK.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 48,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: "#444",
    marginBottom: 16,
  },
  warn: {
    color: "#b45309",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0c4a6e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  hint: {
    marginTop: 20,
    fontSize: 12,
    color: "#888",
  },
});
