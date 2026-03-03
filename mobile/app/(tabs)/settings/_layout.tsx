import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

export default function SettingsLayout() {
  return (
    <TopTabs>
      <TopTabs.Screen name="account" options={{ title: 'Account' }} />
      <TopTabs.Screen name="app-settings" options={{ title: 'App Settings' }} />

      {/* Hide the folder index route from the tab bar */}
      <TopTabs.Screen name="index" options={{ href: null }} />
    </TopTabs>
  );
}