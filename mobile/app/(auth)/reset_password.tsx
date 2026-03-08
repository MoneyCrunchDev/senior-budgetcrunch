import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import TextCustom from '@/components/TextCustom';
import { account } from '@/lib/appwriteConfig';

type ResetParams = {
  userId?: string;
  secret?: string;
  expire?: string;
};

export default function ResetPassword() {
  const { userId, secret } = useLocalSearchParams<ResetParams>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        <TextInput
          style={styles.input}
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextCustom>Confirm Password</TextCustom>
        <TextInput
          style={styles.input}
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          autoCapitalize="none"
          autoCorrect={false}
        />

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
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headline: {
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
    borderColor: 'grey',
  },
  button: {
    backgroundColor: 'black',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
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
    marginBottom: 12,
  },
  successText: {
    color: '#0d7a2d',
    marginBottom: 12,
  },
  linkWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
    color: '#333',
  },
});