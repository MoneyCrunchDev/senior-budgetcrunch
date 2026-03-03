import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

type Props = TextProps & {
  fontSize?: number;
  style?: StyleProp<TextStyle>;
};

export default function TextCustom({ fontSize = 16, style, ...props }: Props) {
  return <Text {...props} style={[{ fontSize }, style]} />;
}

