import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import LinkedBanksSheetContent from "@/components/settings/LinkedBanksSheetContent";
import ModalBottomSheet from "@/components/ModalBottomSheet";
import { useAuth } from "@/context/AuthContext";
import { account } from "@/lib/appwriteConfig";
import {
  e164ToUsDisplay,
  normalizeE164Key,
  usDisplayToE164,
} from "@/lib/phoneE164";
import { colors, fontSize, fontWeight, radius, spacing } from "@/theme";

type Baseline = {
  name: string;
  email: string;
  phoneE164: string;
  phoneDisplay: string;
};

function deriveFromUser(user: Record<string, unknown> | null): Baseline {
  if (!user) {
    return { name: "", email: "", phoneE164: "", phoneDisplay: "" };
  }
  const name = String(user.name ?? "").trim();
  const email = String(user.email ?? "")
    .trim()
    .toLowerCase();
  const prefs = user.prefs;
  const prefPhone =
    prefs && typeof prefs === "object" && prefs !== null && "phoneE164" in prefs
      ? String((prefs as { phoneE164?: string }).phoneE164 ?? "")
      : "";
  const phoneE164 =
    normalizeE164Key(String(user.phone ?? "")) || normalizeE164Key(prefPhone);
  const phoneDisplay = phoneE164 ? e164ToUsDisplay(phoneE164) : "";
  return { name, email, phoneE164, phoneDisplay };
}

function formatPhoneInputDigits(digitsOnly: string): string {
  if (digitsOnly.length <= 3) return digitsOnly;
  if (digitsOnly.length <= 6) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
  }
  return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
}

function maskEmail(email: string): string {
  const trimmed = (email ?? "").trim();
  if (!trimmed) return "";

  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return trimmed;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  // Keep last 4 characters of the local-part.
  const keep = local.length > 4 ? local.slice(-4) : local.slice(-Math.max(1, local.length));
  const maskedLocal =
    local.length <= 4 ? "****" : `${local[0]}***${keep}`;

  return `${maskedLocal}@${domain}`;
}

function maskPhoneToLast4(digitsOrFormatted: string): string {
  const digits = (digitsOrFormatted ?? "").replace(/\D/g, "");
  if (digits.length < 4) return "";

  const last4 = digits.slice(-4);
  // When we have a full US 10-digit number, keep the canonical formatting: ***-***-1234
  if (digits.length === 10) return `***-***-${last4}`;
  return `***-***-${last4}`;
}

export default function Screen() {
  const { user, refreshUser } = useAuth();
  const linkedBanksSheetRef = useRef<BottomSheet>(null);
  const linkedBanksSnapPoints = useMemo(() => ["60%"], []);

  const [baseline, setBaseline] = useState<Baseline>(() => deriveFromUser(null));
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [maskContact, setMaskContact] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || editing) return;
    const next = deriveFromUser(user as Record<string, unknown>);
    setBaseline(next);
    setDraftName(next.name);
    setDraftEmail(next.email);
    setDraftPhone(next.phoneDisplay);
    setFormError(null);
  }, [user, editing]);

  const nameDirty = useMemo(
    () => draftName.trim() !== baseline.name.trim(),
    [draftName, baseline.name]
  );
  const emailDirty = useMemo(
    () =>
      draftEmail.trim().toLowerCase() !== baseline.email.trim().toLowerCase(),
    [draftEmail, baseline.email]
  );
  const phoneDirty = useMemo(() => {
    const nextE164 = normalizeE164Key(usDisplayToE164(draftPhone) ?? "");
    return nextE164 !== normalizeE164Key(baseline.phoneE164);
  }, [draftPhone, baseline.phoneE164]);

  const hasAnyDirty = nameDirty || emailDirty || phoneDirty;

  const openLinkedBanksSheet = () => {
    requestAnimationFrame(() => {
      linkedBanksSheetRef.current?.snapToIndex(0);
    });
  };

  const resetDraftToBaseline = useCallback(() => {
    setDraftName(baseline.name);
    setDraftEmail(baseline.email);
    setDraftPhone(baseline.phoneDisplay);
    setFormError(null);
  }, [baseline]);

  const handleToggleEdit = (value: boolean) => {
    if (value) {
      setDraftName(baseline.name);
      setDraftEmail(baseline.email);
      setDraftPhone(baseline.phoneDisplay);
      setFormError(null);
      setEditing(true);
      return;
    }
    if (hasAnyDirty) {
      Alert.alert(
        "Discard changes?",
        "Your edits will be lost.",
        [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              resetDraftToBaseline();
              setEditing(false);
              setFormError(null);
            },
          },
        ],
        { cancelable: true }
      );
      return;
    }
    setEditing(false);
    setFormError(null);
  };

  const runSaveWithPassword = async (password: string | null) => {
    const needPassword = emailDirty || phoneDirty;
    if (needPassword && (!password || password.length < 8)) {
      setPasswordError("Enter your current password (at least 8 characters).");
      return;
    }

    setPasswordError(null);
    setSubmitting(true);
    setFormError(null);

    try {
      if (nameDirty) {
        const nextName = draftName.trim();
        if (!nextName) {
          throw new Error("Name cannot be empty.");
        }
        await account.updateName(nextName);
      }

      if (emailDirty) {
        await account.updateEmail({
          email: draftEmail.trim().toLowerCase(),
          password: password as string,
        });
      }

      if (phoneDirty) {
        const nextE164 = usDisplayToE164(draftPhone);
        if (!nextE164) {
          throw new Error(
            "Enter a valid US phone number (10 digits), or revert your phone field."
          );
        }
        await account.updatePhone({
          phone: nextE164,
          password: password as string,
        });
        const u = await account.get();
        const prevPrefs =
          u.prefs && typeof u.prefs === "object" && u.prefs !== null
            ? { ...(u.prefs as Record<string, unknown>) }
            : {};
        await account.updatePrefs({
          ...prevPrefs,
          phoneE164: nextE164,
        });
      }

      const fresh = await refreshUser();
      const nextBaseline = deriveFromUser(fresh as Record<string, unknown>);
      setBaseline(nextBaseline);
      setDraftName(nextBaseline.name);
      setDraftEmail(nextBaseline.email);
      setDraftPhone(nextBaseline.phoneDisplay);
      setEditing(false);
      setPasswordModalVisible(false);
      setPasswordInput("");
      Alert.alert("Saved", "Your account information was updated.");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Update failed.";
      if (passwordModalVisible) {
        setPasswordError(msg);
      } else {
        setFormError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startSave = () => {
    setFormError(null);
    if (!hasAnyDirty) {
      Alert.alert("No changes", "Nothing new to save.");
      return;
    }

    if (phoneDirty) {
      const nextE164 = usDisplayToE164(draftPhone);
      if (!nextE164) {
        setFormError(
          "Phone must be a valid US number (10 digits), or match what you had before."
        );
        return;
      }
    }

    const needPassword = emailDirty || phoneDirty;

    if (needPassword) {
      setPasswordInput("");
      setPasswordError(null);
      setPasswordModalVisible(true);
      return;
    }

    void runSaveWithPassword(null);
  };

  const confirmPasswordAndSave = () => {
    void runSaveWithPassword(passwordInput);
  };

  const cancelPasswordModal = () => {
    setPasswordModalVisible(false);
    setPasswordInput("");
    setPasswordError(null);
  };

  const onPhoneChangeText = (text: string) => {
    const digitsOnly = text.replace(/\D/g, "").slice(0, 10);
    setDraftPhone(formatPhoneInputDigits(digitsOnly));
  };

  const emailForDisplay = !editing && maskContact ? maskEmail(draftEmail) : draftEmail;
  const phoneForDisplay = !editing && maskContact ? maskPhoneToLast4(draftPhone) : draftPhone;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Account Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        <View style={styles.editRow}>
          <Text style={styles.editLabel}>Edit my Info</Text>
          <Switch
            value={editing}
            onValueChange={handleToggleEdit}
            trackColor={{ false: colors.borderStrong, true: colors.accent }}
            thumbColor={editing ? colors.primary : colors.surface}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            placeholder={baseline.name ? undefined : "Enter your name"}
            placeholderTextColor={colors.textPlaceholder}
            style={[styles.input, !editing && styles.inputReadonly]}
            value={draftName}
            onChangeText={setDraftName}
            editable={editing}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWithEyeWrap}>
            <TextInput
              placeholder={baseline.email ? undefined : "Enter your email"}
              placeholderTextColor={colors.textPlaceholder}
              style={[
                styles.input,
                !editing && styles.inputReadonly,
                !editing && styles.inputRightPadForEye,
              ]}
              value={emailForDisplay}
              onChangeText={setDraftEmail}
              editable={editing}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!editing ? (
              <TouchableOpacity
                style={styles.eyeButtonInsideInput}
                onPress={() => setMaskContact((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={maskContact ? "Show email and phone" : "Hide email and phone"}
              >
                <Ionicons
                  name={maskContact ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          {editing ? (
            <Text style={styles.hint}>
              Changing email may require verification again in Appwrite.
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWithEyeWrap}>
            <TextInput
              placeholder={
                baseline.phoneDisplay ? undefined : "Enter your phone number"
              }
              placeholderTextColor={colors.textPlaceholder}
              style={[
                styles.input,
                !editing && styles.inputReadonly,
                !editing && styles.inputRightPadForEye,
              ]}
              value={phoneForDisplay}
              onChangeText={editing ? onPhoneChangeText : () => {}}
              editable={editing}
              keyboardType="phone-pad"
            />
            {!editing ? (
              <TouchableOpacity
                style={styles.eyeButtonInsideInput}
                onPress={() => setMaskContact((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={maskContact ? "Show email and phone" : "Hide email and phone"}
              >
                <Ionicons
                  name={maskContact ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
      </View>

      {editing ? (
        <View style={styles.editActions}>
          <TouchableOpacity
            style={[styles.secondaryButton, submitting && styles.buttonDisabled]}
            onPress={() => handleToggleEdit(false)}
            disabled={submitting}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              styles.saveButtonFlex,
              (submitting || !hasAnyDirty) && styles.buttonDisabled,
            ]}
            onPress={startSave}
            disabled={submitting || !hasAnyDirty}
          >
            {submitting && !passwordModalVisible ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>Save changes</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

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

      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelPasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm password</Text>
            <Text style={styles.modalBody}>
              Enter your current account password to update your email or phone.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              placeholderTextColor={colors.textPlaceholder}
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
              autoCapitalize="none"
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondary}
                onPress={cancelPasswordModal}
                disabled={submitting}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimary, submitting && styles.buttonDisabled]}
                onPress={confirmPasswordAndSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },

  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  editLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },

  field: {
    marginBottom: spacing.md,
  },

  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
  },

  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  input: {
    height: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.lg,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },

  inputRightPadForEye: {
    paddingRight: spacing.lg + spacing.xxs,
  },

  inputWithEyeWrap: {
    position: "relative",
  },

  eyeButtonInsideInput: {
    position: "absolute",
    right: spacing.xs,
    top: 16.4,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  inputReadonly: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textSecondary,
  },

  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.xs,
  },

  rowButton: {
    height: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },

  chevron: {
    fontSize: 22,
    color: colors.textPlaceholder,
    marginLeft: spacing.xs,
    lineHeight: 22,
  },

  editActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  primaryButton: {
    height: spacing.xxl + spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonFlex: {
    flex: 1,
  },

  secondaryButton: {
    height: spacing.xxl + spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },

  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },

  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: spacing.lg,
  },

  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },

  modalBody: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    alignItems: "center",
  },

  modalSecondary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  modalPrimary: {
    minWidth: 100,
    height: spacing.xxxl,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
