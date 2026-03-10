import { TopTabScreenHeader } from '@/components/TopTabScreenHeader';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View } from 'react-native';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

export default function ActivityLayout() {
  return (
    <View style={{ flex: 1 }}>
      <TopTabScreenHeader title="Activity" />
      <TopTabs style={{ flex: 1 }}>
        <TopTabs.Screen name="chart" options={{ title: 'Chart' }} />
        <TopTabs.Screen name="categories" options={{ title: 'Categories' }} />

        {/* Hide the folder index route from the tab bar */}
        <TopTabs.Screen name="index" options={{ href: null }} />
      </TopTabs>
    </View>
  );
}