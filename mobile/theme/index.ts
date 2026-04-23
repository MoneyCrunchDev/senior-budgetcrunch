/**
 * MoneyCrunch theme — single source of truth for colors, spacing,
 * radii, typography, and elevation.
 *
 * Usage:
 *   import { colors, spacing, radius, fontSize } from "@/theme";
 *
 *   const styles = StyleSheet.create({
 *     card: {
 *       backgroundColor: colors.surface,
 *       borderColor: colors.border,
 *       borderRadius: radius.lg,
 *       padding: spacing.md,
 *     },
 *     title: {
 *       fontSize: fontSize.xl,
 *       color: colors.textPrimary,
 *     },
 *   });
 *
 * The brand palette (`brand`) comes from Realtime Colors:
 *   --text:       #fdfbd4
 *   --background: #1f1f1f
 *   --primary:    #00573F
 *   --secondary:  #466a3b
 *   --accent:     #6eae72
 *
 * Prefer the semantic `colors` tokens (e.g. `colors.primary`,
 * `colors.textPrimary`) over `brand.*` or `neutral[n]` in screens so we
 * can re-theme in one place.
 */

export * from "./colors";
export * from "./spacing";
export * from "./radius";
export * from "./typography";
export * from "./shadows";

import { colors } from "./colors";
import { spacing, GRID } from "./spacing";
import { radius } from "./radius";
import { fontSize, fontWeight, lineHeight, textStyles } from "./typography";
import { shadows } from "./shadows";

/** Grouped theme object — handy when you only want to import one thing. */
export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  textStyles,
  shadows,
  /** Legacy: many screens use `const GRID = 8`; re-export so we can delete those. */
  GRID,
} as const;

export type Theme = typeof theme;
