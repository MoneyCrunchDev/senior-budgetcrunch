/**
 * Bank connect (Plaid Link) — shared screen.
 * Used from: onboarding (connect bank step) and Settings → Add Another Bank Account.
 *
 * Flow:
 * 1. User must be signed in (Appwrite user id = Plaid client_user_id).
 * 2. Tap "Connect bank" → POST { action: "createLinkToken", userId } → link_token.
 * 3. react-native-plaid-link-sdk: create({ token }) then open({ onSuccess, onExit }).
 *
 * Native module: requires a dev build (expo run:ios / run:android or EAS), not Expo Go.
 * After first install of react-native-plaid-link-sdk, rebuild the native app once.
 */
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { createLinkToken, exchangePublicToken } from "@/lib/plaidApi";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LinkExit, LinkSuccess } from "react-native-plaid-link-sdk";
import {
  create,
  dismissLink,
  LinkIOSPresentationStyle,
  LinkLogLevel,
  open,
} from "react-native-plaid-link-sdk";

import { colors, fontSize, fontWeight, radius, spacing } from "@/theme";

const ACCENT_GREEN = colors.primary;
const ACCENT_GREEN_DARK = colors.primaryDark;

type LinkSuccessState = { institutionName: string };

export default function BankConnectScreen() {
  const { user, loading: authLoading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<LinkSuccessState | null>(null);
  const hapticsFired = useRef(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!linkSuccess || hapticsFired.current) return;
    hapticsFired.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [linkSuccess]);

  /** Avoid Fabric race on Android: do not setState + replace in one tick; defer navigation. */
  const leaveAfterLinkSuccess = useCallback(() => {
    hapticsFired.current = false;
    InteractionManager.runAfterInteractions(() => {
      router.replace("/(tabs)/settings/account");
    });
  }, []);

  useEffect(() => {
    if (!linkSuccess) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      leaveAfterLinkSuccess();
      return true;
    });
    return () => sub.remove();
  }, [linkSuccess, leaveAfterLinkSuccess]);

  const userId = user?.$id ?? null;

  const handleBack = useCallback(() => {
    if (linkSuccess) {
      leaveAfterLinkSuccess();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings/account");
    }
  }, [linkSuccess, leaveAfterLinkSuccess]);

  const onConnectBank = useCallback(async () => {
    if (!userId) {
      Alert.alert(
        "Sign in required",
        "Sign in so we can link your bank to your account.",
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
            const inst = success.metadata?.institution;
            await exchangePublicToken(userId!, success.publicToken, {
              institutionName: inst?.name,
              institutionId: inst?.id,
            });
            setBusy(false);
            dismissLink();
            const bankLabel = inst?.name?.trim() || "Your bank";
            setLinkSuccess({ institutionName: bankLabel });
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
            Alert.alert(
              "Link closed",
              exit.error.displayMessage ?? "Something went wrong.",
            );
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
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View
        style={[styles.topBar, { paddingTop: Math.max(insets.top, spacing.md) }]}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backRow,
            pressed && styles.backRowPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={linkSuccess ? "Done, go back" : "Go back"}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {linkSuccess ? (
          <View style={styles.card}>
            <View style={styles.successBadge}>
              <View style={styles.successIconRing}>
                <Ionicons name="checkmark" size={36} color={colors.textOnPrimary} />
              </View>
            </View>
            <Text style={styles.successKicker}>Bank linked</Text>
            <Text style={styles.successBankName}>{linkSuccess.institutionName}</Text>
            <Text style={styles.successSubhead}>
              You’re all set — we’ll keep transactions in sync for your budget.
            </Text>
            <View style={styles.successCheckRow}>
              <Ionicons name="lock-closed" size={18} color={ACCENT_GREEN_DARK} />
              <Text style={styles.successCheckText}>
              Connected securely through Plaid; we never see your bank password.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={32} color={colors.successStrong} />
              </View>
            </View>

            <Text style={styles.title}>Connect your bank</Text>
            <Text style={styles.body}>
              {`We use Plaid to connect your accounts securely. You'll sign in to your bank inside Plaid's flow. Sandbox: use any test institution and credentials from Plaid's docs.`}
            </Text>
            {!userId ? (
              <Text style={styles.warn}>
                Sign in first, then return here to connect.
              </Text>
            ) : null}
            <Pressable
              style={[
                styles.button,
                (!userId || busy) && styles.buttonDisabled,
              ]}
              onPress={onConnectBank}
              disabled={!userId || busy}
            >
              {busy ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.buttonText}>Connect bank</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },

  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  topBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
    gap: spacing.xxs,
  },

  backRowPressed: {
    opacity: 0.6,
  },

  backText: {
    fontSize: 17,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  iconWrap: {
    alignItems: "center",
    marginBottom: spacing.md,
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  body: {
    fontSize: fontSize.lg,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: "center",
  },

  warn: {
    color: colors.warningStrong,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
    textAlign: "center",
  },

  button: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: fontWeight.bold,
  },

  successBadge: {
    alignItems: "center",
    marginBottom: spacing.md,
  },

  successIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: ACCENT_GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ACCENT_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },

  successKicker: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: ACCENT_GREEN_DARK,
    textAlign: "center",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.xxs,
  },

  successBankName: {
    fontSize: 26,
    fontWeight: fontWeight.extrabold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.xxs,
    letterSpacing: -0.3,
  },

  successSubhead: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  successBody: {
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
  },

  successCheckRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.primarySoftBorder,
  },

  successCheckText: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 20,
    color: colors.primaryDark,
    fontWeight: fontWeight.medium,
  },

  hint: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: "center",
  },
});
