import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, Text } from 'react-native';
import { useAuth } from '@/context/AuthContext';
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
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="stats-chart-outline" size={size} color={color} />
    ),
  }}
/>

<Tabs.Screen
  name="settings"
  options={{
    title: 'Settings',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="settings-outline" size={size} color={color} />
    ),
  }}
/>
    </Tabs>
  );
}