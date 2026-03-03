import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

export default function TimelineLayout() {
  return (
    <TopTabs>
      <TopTabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <TopTabs.Screen name="transactions" options={{ title: 'Transaction History' }} />

      {/* Hide the folder index route from the tab bar */}
      <TopTabs.Screen name="index" options={{ href: null }} />
    </TopTabs>
  );
}