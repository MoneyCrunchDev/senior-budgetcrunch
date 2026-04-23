import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Linking from 'expo-linking';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import TextCustom from '@/components/TextCustom';
import { account } from '@/lib/appwriteConfig';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

type ForgotPasswordFormProps = {
  /** Email to prefill (e.g. from login screen). Updated when parent opens sheet again. */
  prefilledEmail?: string;
};

/**
 * Forgot password form content for use inside ModalBottomSheet.
 * Owns its own state and Appwrite createRecovery logic.
 */
export default function ForgotPasswordForm({ prefilledEmail = '' }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(prefilledEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setEmail(prefilledEmail);
  }, [prefilledEmail]);

  const disabled = useMemo(() => submitting || !email.trim(), [email, submitting]);

  const handleSendRecovery = async () => {
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail) return;

    const functionBaseUrl = process.env.EXPO_PUBLIC_APPWRITE_FUNCTION_URL;
    if (!functionBaseUrl) {
      setError('Missing EXPO_PUBLIC_APPWRITE_FUNCTION_URL in your mobile .env.');
      return;
    }

    const redirectScheme = Linking.createURL('/');
    const redirectUrl = `${functionBaseUrl}/reset-password?scheme=${encodeURIComponent(redirectScheme)}`;

    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await account.createRecovery(nextEmail, redirectUrl);
      setSuccess('Check your email for a reset link.');
    } catch (e: any) {
      const msg = e?.message ?? '';
      const isUserNotFound =
        msg.includes('could not be found') ||
        msg.includes('user not found') ||
        msg.includes('User with the requested ID');
      setError(
        isUserNotFound
          ? 'This email is not connected to a MoneyCrunch account.'
          : msg || 'Failed to send reset link. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TextCustom style={styles.sheetTitle} fontSize={28}>
        Forgot Password
      </TextCustom>
      <Text style={styles.sheetSubtitle}>Enter your email and we&apos;ll send you a reset link.</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

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
      />

      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handleSendRecovery}
        disabled={disabled}>
        <Text style={styles.buttonText}>{submitting ? 'Sending…' : 'Send reset link'}</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  sheetTitle: {
    textAlign: 'center',
    fontWeight: fontWeight.bold,
    fontStyle: 'italic',
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
  successText: {
    color: colors.successText,
    marginBottom: spacing.md,
  },
});
