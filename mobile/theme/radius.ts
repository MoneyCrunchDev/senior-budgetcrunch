/**
 * Border-radius scale.
 * Keep radii quantized so cards, buttons, and inputs feel consistent.
 */

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  /** Fully pill-shaped (use a large number, not 9999, for RN compatibility). */
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
