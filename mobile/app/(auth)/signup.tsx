import { Ionicons } from '@expo/vector-icons';
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
  const [showPassword, setShowPassword] = useState(false);
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
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="newPassword"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((v) => !v)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

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
    padding: 24,
    justifyContent: 'center',
  },
  headline: {
    textAlign: 'center',
    marginTop: -80,
    marginBottom: 32,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderColor: 'grey',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'grey',
    marginTop: 8,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 8,
  },
  eyeButton: {
    padding: 8,
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

