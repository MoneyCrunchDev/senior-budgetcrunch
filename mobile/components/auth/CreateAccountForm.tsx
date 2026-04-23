import { Ionicons } from '@expo/vector-icons';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ID } from 'react-native-appwrite';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import TextCustom from '@/components/TextCustom';
import { useAuth } from '@/context/AuthContext';
import { account } from '@/lib/appwriteConfig';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

type CreateAccountFormProps = {
  /** Called when user taps X or "Log in" to close the sheet. */
  onClose: () => void;
  /** Optional email to prefill (e.g. from login screen). */
  prefilledEmail?: string;
};

/**
 * Create account form content for use inside ModalBottomSheet.
 * Owns its own state and Appwrite create + signin + redirect logic.
 */
export default function CreateAccountForm({ onClose, prefilledEmail = '' }: CreateAccountFormProps) {
  const { signin, rememberPasswordForPhoneSetup, clearPasswordForPhoneSetup } = useAuth();
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(prefilledEmail);
  }, [prefilledEmail]);

  const disabled = useMemo(
    () => submitting || !email.trim() || !password || password.length < 8,
    [email, password, submitting]
  );

  const handleSignup = async () => {
    const nextEmail = email.trim().toLowerCase();

    setError(null);
    setSubmitting(true);
    try {
      await account.create({
        userId: ID.unique(),
        email: nextEmail,
        password,
      });
      await signin({ email: nextEmail, password });
      rememberPasswordForPhoneSetup(password);
      router.replace('/(onboarding)/(perms)/notification');
    } catch (e: any) {
      clearPasswordForPhoneSetup();
      setError(e?.message ?? 'Signup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.headerButton}
          accessibilityLabel="Close"
          accessibilityRole="button">
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <TextCustom style={styles.sheetTitle} fontSize={20}>
          Create an account
        </TextCustom>
        <TouchableOpacity onPress={onClose} style={styles.logInButton} accessibilityRole="button">
          <Text style={styles.logInButtonText}>Log in</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextCustom>Email</TextCustom>
      <BottomSheetTextInput
        placeholder="you@example.com"
        placeholderTextColor={colors.textPlaceholder}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      <TextCustom>Password</TextCustom>
      <View style={styles.passwordRow}>
        <BottomSheetTextInput
          placeholder="At least 8 characters"
          placeholderTextColor={colors.textPlaceholder}
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          textContentType="newPassword"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword((v) => !v)}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          accessibilityRole="button">
          <Ionicons
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={22}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={disabled}>
        <Text style={styles.buttonText}>{submitting ? 'Creating account…' : 'Get started'}</Text>
      </TouchableOpacity>

      <Text style={styles.legalText}>
        By continuing I agree with the <Text style={styles.legalLink}>Terms & Conditions</Text>{' '}
        <Text style={styles.legalLink}>Privacy Policy</Text>
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerButton: {
    padding: spacing.xs,
  },
  sheetTitle: {
    fontWeight: fontWeight.bold,
    fontStyle: 'italic',
  },
  logInButton: {
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  logInButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
  legalText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: colors.link,
  },
});
