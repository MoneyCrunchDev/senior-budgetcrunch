import React, { useMemo, useState } from 'react';
import { Link, router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import TextCustom from '@/components/TextCustom';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { signin: signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = useMemo(() => {
    return submitting || !email.trim() || !password;
  }, [email, password, submitting]);

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

  return (
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
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
})