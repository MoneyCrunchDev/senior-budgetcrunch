import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Linking from 'expo-linking';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import TextCustom from '@/components/TextCustom';
import { account } from '@/lib/appwriteConfig';

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
    fontWeight: '700',
    fontStyle: 'italic',
  },
  sheetSubtitle: {
    textAlign: 'center',
    color: '#444',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderColor: 'grey',
  },
  button: {
    backgroundColor: 'black',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#b00020',
    marginBottom: 16,
  },
  successText: {
    color: '#0d7a2d',
    marginBottom: 16,
  },
});
