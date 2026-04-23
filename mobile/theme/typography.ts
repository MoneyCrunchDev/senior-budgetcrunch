/**
 * Typography tokens.
 * Font family lives with the native build (Expo Font); here we just
 * standardize sizes, weights, and line heights.
 */

import type { TextStyle } from "react-native";

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  display: 24,
  heroSm: 28,
  hero: 32,
  heroLg: 48,
  heroXl: 65,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
} as const satisfies Record<string, TextStyle["fontWeight"]>;

export const lineHeight = {
  tight: 18,
  normal: 20,
  relaxed: 24,
  loose: 26,
} as const;

/** Convenience presets — use sparingly; most screens will compose from the primitives. */
export const textStyles = {
  heroTitle: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  screenTitle: {
    fontSize: fontSize.heroSm,
    fontWeight: fontWeight.bold,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  body: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.relaxed,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
} as const satisfies Record<string, TextStyle>;
