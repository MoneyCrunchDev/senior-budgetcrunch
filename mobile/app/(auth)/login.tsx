import BottomSheet, { BottomSheetBackdrop, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Linking from 'expo-linking';
import { Link, router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import TextCustom from '@/components/TextCustom';
import { useAuth } from '@/context/AuthContext';
import { account } from '@/lib/appwriteConfig';

export default function Login() {
  const { signin: signIn } = useAuth();
  const forgotSheetRef = useRef<BottomSheet>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const {height} = useWindowDimensions();
  

  const disabled = useMemo(() => {
    return submitting || !email.trim() || !password;
  }, [email, password, submitting]);
  const forgotDisabled = useMemo(() => {
    return forgotSubmitting || !forgotEmail.trim();
  }, [forgotEmail, forgotSubmitting]);
  const forgotSnapPoints = useMemo(() => [Math.round(height * 0.35)], [height]);

  const handleSubmit = async () => {
    const nextEmail = email.trim().toLowerCase();
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email: nextEmail, password });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openForgotSheet = () => {
    const prefilledEmail = email.trim().toLowerCase();
    setForgotEmail(prefilledEmail);
    setForgotError(null);
    setForgotSuccess(null);
    // Snap imperatively to avoid strict-mode shared value warnings.
    requestAnimationFrame(() => {
      forgotSheetRef.current?.snapToIndex(0);
    });
  };

  const handleSendRecovery = async () => {
    const nextEmail = forgotEmail.trim().toLowerCase();
    if (!nextEmail) return;

    const functionBaseUrl = process.env.EXPO_PUBLIC_APPWRITE_FUNCTION_URL;
    if (!functionBaseUrl) {
      setForgotError('Missing EXPO_PUBLIC_APPWRITE_FUNCTION_URL in your mobile .env.');
      return;
    }

    const redirectScheme = Linking.createURL('/');
    const redirectUrl = `${functionBaseUrl}/reset-password?scheme=${encodeURIComponent(redirectScheme)}`;

    setForgotError(null);
    setForgotSuccess(null);
    setForgotSubmitting(true);
    try {
      await account.createRecovery(nextEmail, redirectUrl);
      setForgotSuccess('Check your email for a reset link.');
    } catch (e: any) {
      setForgotError(e?.message ?? 'Failed to send reset link. Please try again.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View>
            <TextCustom style={styles.headline} fontSize={72}>
              Sign In
            </TextCustom>

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
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} onPress={handleSubmit} disabled={disabled}>
              <Text style={styles.buttonText}>{submitting ? 'Signing in…' : 'Login'}</Text>
            </TouchableOpacity>

            <View style={styles.linksRow}>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Create account</Text>
                </TouchableOpacity>
              </Link>
              <TouchableOpacity onPress={openForgotSheet}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <BottomSheet
        ref={forgotSheetRef}
        index={-1}
        animateOnMount={false}
        enableDynamicSizing={false}
        snapPoints={forgotSnapPoints}
        enablePanDownToClose
        style={styles.sheet}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        onClose={() => {
          setForgotError(null);
          setForgotSuccess(null);
        }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior="close"
            opacity={0.85}
          />
        )}>
        <View style={styles.sheetContent}>
          <TextCustom style={styles.sheetTitle} fontSize={28}>
            Forgot Password
          </TextCustom>
          <Text style={styles.sheetSubtitle}>Enter your email and we&apos;ll send you a reset link.</Text>

          {forgotError ? <Text style={styles.errorText}>{forgotError}</Text> : null}
          {forgotSuccess ? <Text style={styles.successText}>{forgotSuccess}</Text> : null}

          <TextCustom>Email</TextCustom>
          <BottomSheetTextInput
            placeholder="you@example.com"
            style={styles.input}
            value={forgotEmail}
            onChangeText={setForgotEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <TouchableOpacity style={[styles.button, forgotDisabled && styles.buttonDisabled]} onPress={handleSendRecovery} disabled={forgotDisabled}>
            <Text style={styles.buttonText}>{forgotSubmitting ? 'Sending…' : 'Send reset link'}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
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
    flex:1,
    padding: 20,
    justifyContent: 'center',
  },
  headline:{
    textAlign:'center',
    marginTop:-100,
    marginBottom:50,
    fontWeight:'700',
    fontStyle:'italic'
  },
  input:{
    borderWidth:1,
    borderRadius:10, 
    padding:10,

    marginTop:10,
    marginBottom:10,
    borderColor:"grey"
  },
  button: {
    backgroundColor: 'black',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop:10,
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
  sheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheet: {
    zIndex: 1000,
    elevation: 1000,
  },
  sheetHandle: {
    width: 42,
    backgroundColor: '#C7C7CC',
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 22,
  },
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
  successText: {
    color: '#0d7a2d',
    marginBottom: 12,
  },
})