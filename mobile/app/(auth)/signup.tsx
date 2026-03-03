import { ID } from 'react-native-appwrite';
import { Link, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import TextCustom from '@/components/TextCustom';
import { useAuth } from '@/context/AuthContext';
import { account } from '@/lib/appwriteConfig';

export default function Signup() {
  const { signin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => {
    return submitting || !email.trim() || !password || password.length < 8;
  }, [email, password, submitting]);

  const handleSignup = async () => {
    const nextEmail = email.trim().toLowerCase();
    const nextName = name.trim();

    setError(null);
    setSubmitting(true);
    try {
      await account.create(ID.unique(), nextEmail, password, nextName || undefined);
      await signin({ email: nextEmail, password });
      router.replace('/(onboarding)/(perms)/notification');
    } catch (e: any) {
      setError(e?.message ?? 'Signup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TextCustom style={styles.headline} fontSize={56}>
          Sign Up
        </TextCustom>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextCustom>Name (optional)</TextCustom>
        <TextInput
          placeholder="Your name"
          style={styles.input}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="name"
        />

        <TextCustom>Email</TextCustom>
        <TextInput
          placeholder="you@example.com"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <TextCustom>Password</TextCustom>
        <TextInput
          style={styles.input}
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
        />

        <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} onPress={handleSignup} disabled={disabled}>
          <Text style={styles.buttonText}>{submitting ? 'Creating account…' : 'Create account'}</Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.footerText, styles.footerLink]}>Log in</Text>
            </TouchableOpacity>
          </Link>
        </View>
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
    marginTop: -80,
    marginBottom: 30,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    borderColor: 'grey',
  },
  button: {
    backgroundColor: 'black',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#333',
  },
  footerLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});

