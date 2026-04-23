import { TopTabScreenHeader } from '@/components/TopTabScreenHeader';
import { colors, fontSize, fontWeight } from '@/theme';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View } from 'react-native';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

/** Default child for this layout (deep links / URLs with no leaf segment). */
export const unstable_settings = {
  initialRouteName: 'calendar',
};

const topTabScreenOptions = {
  tabBarStyle: { backgroundColor: colors.surface },
  tabBarActiveTintColor: colors.textPrimary,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarIndicatorStyle: { backgroundColor: colors.primary },
  tabBarLabelStyle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
} as const;

export default function TimelineLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.screenBackground }}>
      <TopTabScreenHeader title="Timeline" />
      <TopTabs
        initialRouteName="calendar"
        style={{ flex: 1 }}
        screenOptions={topTabScreenOptions}>
        <TopTabs.Screen name="calendar" options={{ title: 'CALENDAR' }} />
        <TopTabs.Screen name="transactions" options={{ title: 'TRANSACTIONS' }} />
      </TopTabs>
    </View>
  );
}
