import { TopTabScreenHeader } from '@/components/TopTabScreenHeader';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View } from 'react-native';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

/** Default child for this layout (deep links / URLs with no leaf segment). */
export const unstable_settings = {
  initialRouteName: 'calendar',
};

export default function TimelineLayout() {
  return (
    <View style={{ flex: 1 }}>
      <TopTabScreenHeader title="Timeline" />
      <TopTabs initialRouteName="calendar" style={{ flex: 1 }}>
        <TopTabs.Screen name="calendar" options={{ title: 'CALENDAR' }} />
        <TopTabs.Screen name="transactions" options={{ title: 'TRANSACTIONS' }} />
      </TopTabs>
    </View>
  );
}
