import { TopTabScreenHeader } from '@/components/TopTabScreenHeader';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View } from 'react-native';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

/** Default child for this layout (deep links / URLs with no leaf segment). */
export const unstable_settings = {
  initialRouteName: 'account',
};

export default function SettingsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <TopTabScreenHeader title="Settings" />
      <TopTabs initialRouteName="account" style={{ flex: 1 }}>
        <TopTabs.Screen name="account" options={{ title: 'ACCOUNT' }} />
        <TopTabs.Screen name="app-settings" options={{ title: 'APP' }} />
      </TopTabs>
    </View>
  );
}
