import { TopTabScreenHeader } from '@/components/TopTabScreenHeader';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View } from 'react-native';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

export default function TimelineLayout() {
  return (
    <View style={{ flex: 1 }}>
      <TopTabScreenHeader title="Timeline" />
      <TopTabs style={{ flex: 1 }}>
        <TopTabs.Screen name="calendar" options={{ title: 'Calendar' }} />
        <TopTabs.Screen name="transactions" options={{ title: 'Transaction History' }} />

        {/* Hide the folder index route from the tab bar */}
        <TopTabs.Screen name="index" options={{ href: null }} />
      </TopTabs>
    </View>
  );
}