import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import TextCustom from '@/components/TextCustom';

export default function ForgotPassword() {
  const modalRef = useRef<BottomSheetModal>(null);
  const [email, setEmail] = useState('');
  const { height } = useWindowDimensions();

  const snapPoints = useMemo(() => [Math.max(280, Math.round(height * 0.42))], [height]);
  const disabled = useMemo(() => !email.trim(), [email]);

  useEffect(() => {
    modalRef.current?.present();
  }, []);

  return (
    <View style={styles.screen} pointerEvents="box-none">
      <BottomSheetModal
        ref={modalRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        onDismiss={() => router.back()}
        style={styles.sheet}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            pressBehavior="close"
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.35}
          />
        )}
      >
        <View style={styles.content}>
          <TextCustom style={styles.title} fontSize={28}>
            Forgot Password
          </TextCustom>

          <Text style={styles.subtitle}>Enter your email and we’ll send you a reset link.</Text>

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

          <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} disabled={disabled}>
            <Text style={styles.buttonText}>Send reset link</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  sheet: {
    marginHorizontal: 10,
  },
  sheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    width: 42,
    backgroundColor: '#C7C7CC',
  },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 22 },
  title: { textAlign: 'center', fontWeight: '700', fontStyle: 'italic' },
  subtitle: { textAlign: 'center', color: '#444', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 10, marginBottom: 12, borderColor: 'grey' },
  button: { backgroundColor: 'black', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});