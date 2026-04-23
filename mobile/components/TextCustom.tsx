import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

import { colors } from '@/theme';

type Props = TextProps & {
  fontSize?: number;
  style?: StyleProp<TextStyle>;
};

/**
 * Default in-app text. Picks up theme's primary text color by default so
 * callers don't have to color every label.
 */
export default function TextCustom({ fontSize = 16, style, ...props }: Props) {
  return (
    <Text
      {...props}
      style={[{ fontSize, color: colors.textPrimary }, style]}
    />
  );
}
