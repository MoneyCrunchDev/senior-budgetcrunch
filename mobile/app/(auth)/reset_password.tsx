import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import TextCustom from '@/components/TextCustom';
import { account } from '@/lib/appwriteConfig';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

type ResetParams = {
  userId?: string;
  secret?: string;
  expire?: string;
};

export default function ResetPassword() {
  const { userId, secret } = useLocalSearchParams<ResetParams>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const disabled = useMemo(() => {
    return submitting || !password || !confirmPassword;
  }, [password, confirmPassword, submitting]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!userId || !secret) {
      setError('Reset link is invalid or missing required data.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      // react-native-appwrite supports positional args here.
      await account.updateRecovery(String(userId), String(secret), password);

      setSuccess('Password updated. Redirecting to login…');

      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 900);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TextCustom style={styles.headline} fontSize={48}>
          Reset Password
        </TextCustom>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <TextCustom>New Password</TextCustom>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.textPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showNewPassword}
            textContentType="newPassword"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowNewPassword((v) => !v)}
            accessibilityLabel={showNewPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Ionicons
              name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TextCustom>Confirm Password</TextCustom>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Re-enter password"
            placeholderTextColor={colors.textPlaceholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            textContentType="newPassword"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword((v) => !v)}
            accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.linkWrap}>
          <Text style={styles.linkText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  headline: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontWeight: fontWeight.bold,
    fontStyle: 'italic',
    color: colors.textPrimary,
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
  successText: {
    color: colors.successText,
    marginBottom: spacing.md,
  },
  linkWrap: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: fontWeight.semibold,
    color: colors.link,
  },
});