import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, Text } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { ActivityCategoriesProvider } from '@/context/ActivityCategoriesContext';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12 }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <TransactionProvider>
    <ActivityCategoriesProvider>
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
  name="goals"
  options={{
    title: 'Goals',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="flag-outline" size={size} color={color} />
    ),
  }}
/>
      <Tabs.Screen
  name="timeline"
  options={{
    title: 'Timeline',
    href: '/timeline/calendar',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="calendar-outline" size={size} color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="index"
  options={{
    title: 'Home',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="map-outline" size={size} color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="activity"
  options={{
    title: 'Activity',
    href: '/activity/chart',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="stats-chart-outline" size={size} color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="settings"
  options={{
    title: 'Settings',
    href: '/settings/account',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="settings-outline" size={size} color={color} />
    ),
  }}
/>
    </Tabs>
    </ActivityCategoriesProvider>
    </TransactionProvider>
  );
}