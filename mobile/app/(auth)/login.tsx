import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import CreateAccountForm from '@/components/auth/CreateAccountForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import ModalBottomSheet from '@/components/ModalBottomSheet';
import TextCustom from '@/components/TextCustom';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { signin: signIn, clearPasswordForPhoneSetup } = useAuth();
  const forgotSheetRef = useRef<BottomSheet>(null);
  const signupSheetRef = useRef<BottomSheet>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPrefilledEmail, setForgotPrefilledEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { height } = useWindowDimensions();

  const disabled = useMemo(() => {
    return submitting || !email.trim() || !password;
  }, [email, password, submitting]);
  const forgotSnapPoints = useMemo(() => [Math.round(height * 0.35)], [height]);
  const signupSnapPoints = useMemo(() => [Math.round(height * 0.75)], [height]);

  const handleSubmit = async () => {
    const nextEmail = email.trim().toLowerCase();
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email: nextEmail, password });
      clearPasswordForPhoneSetup();
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openForgotSheet = () => {
    setForgotPrefilledEmail(email.trim().toLowerCase());
    requestAnimationFrame(() => {
      forgotSheetRef.current?.snapToIndex(0);
    });
  };

  const openSignupSheet = () => {
    requestAnimationFrame(() => {
      signupSheetRef.current?.snapToIndex(0);
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View>
            <TextCustom style={styles.headline} fontSize={65}>
              MoneyCrunch
            </TextCustom>
            <Text style={styles.subtitle}>
              Log in to your account to continue
              </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextCustom>Email</TextCustom>
            <TextInput
              placeholder="you@example.com"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <TextCustom>Password</TextCustom>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="password"
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

            <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} onPress={handleSubmit} disabled={disabled}>
              <Text style={styles.buttonText}>{submitting ? 'Signing in…' : 'Login'}</Text>
            </TouchableOpacity>

            <View style={styles.linksRow}>
              <TouchableOpacity onPress={openSignupSheet}>
                <Text style={styles.linkText}>Create account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={openForgotSheet}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ModalBottomSheet ref={forgotSheetRef} snapPoints={forgotSnapPoints}>
        <ForgotPasswordForm prefilledEmail={forgotPrefilledEmail} />
      </ModalBottomSheet>

      <ModalBottomSheet ref={signupSheetRef} snapPoints={signupSnapPoints}>
        <CreateAccountForm onClose={() => signupSheetRef.current?.close()} prefilledEmail={email.trim().toLowerCase() || undefined} />
      </ModalBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
  },
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
    marginTop: -96,
    marginBottom: 48,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '400',
    fontSize: 16,
    color: '#666',
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
  linksRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
    color: '#333',
  },
})