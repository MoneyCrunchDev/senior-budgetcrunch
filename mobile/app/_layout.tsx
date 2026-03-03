import { AuthProvider } from '@/context/AuthContext';
import { Stack } from 'expo-router';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
