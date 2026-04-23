import { TopTabScreenHeader } from '@/components/TopTabScreenHeader';
import { colors, fontSize, fontWeight } from '@/theme';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View } from 'react-native';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

/** Default child for this layout (deep links / URLs with no leaf segment). */
export const unstable_settings = {
  initialRouteName: 'account',
};

const topTabScreenOptions = {
  tabBarStyle: { backgroundColor: colors.surface },
  tabBarActiveTintColor: colors.textPrimary,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarIndicatorStyle: { backgroundColor: colors.primary },
  sceneContainerStyle: { backgroundColor: colors.screenBackground },
  tabBarLabelStyle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
} as const;

export default function SettingsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.screenBackground }}>
      <TopTabScreenHeader title="Settings" />
      <TopTabs
        initialRouteName="account"
        style={{ flex: 1 }}
        screenOptions={topTabScreenOptions}>
        <TopTabs.Screen name="account" options={{ title: 'ACCOUNT' }} />
        <TopTabs.Screen name="app-settings" options={{ title: 'APP' }} />
      </TopTabs>
    </View>
  );
}
