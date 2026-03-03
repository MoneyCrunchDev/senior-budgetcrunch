import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

export default function ActivityLayout() {
  return (
    <TopTabs>
      <TopTabs.Screen name="chart" options={{ title: 'Chart' }} />
      <TopTabs.Screen name="categories" options={{ title: 'Categories' }} />

      {/* Hide the folder index route from the tab bar */}
      <TopTabs.Screen name="index" options={{ href: null }} />
    </TopTabs>
  );
}