import { TopTabScreenHeader } from '@/components/TopTabScreenHeader';
import { ActivityCategoriesProvider } from '@/context/ActivityCategoriesContext';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View } from 'react-native';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

/** Default child for this layout (deep links / URLs with no leaf segment). */
export const unstable_settings = {
  initialRouteName: 'chart',
};

export default function ActivityLayout() {
  return (
    <ActivityCategoriesProvider>
      <View style={{ flex: 1 }}>
        <TopTabScreenHeader title="Activity" />
        <TopTabs initialRouteName="chart" style={{ flex: 1 }}>
          <TopTabs.Screen name="chart" options={{ title: 'CHART' }} />
          <TopTabs.Screen name="categories" options={{ title: 'CATEGORIES' }} />
        </TopTabs>
      </View>
    </ActivityCategoriesProvider>
  );
}
