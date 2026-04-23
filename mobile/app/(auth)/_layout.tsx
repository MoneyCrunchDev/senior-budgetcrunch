import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, SafeAreaView, Text } from 'react-native';

export default function AuthLayout() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.screenBackground,
        }}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ marginTop: spacing.sm, color: colors.textSecondary }}>
          Loading…
        </Text>
      </SafeAreaView>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
