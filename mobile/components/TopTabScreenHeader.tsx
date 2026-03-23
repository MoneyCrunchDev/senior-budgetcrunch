import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

type TopTabScreenHeaderProps = {
  title: string;
};

export function TopTabScreenHeader({ title }: TopTabScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
