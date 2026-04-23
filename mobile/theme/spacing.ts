/**
 * MoneyCrunch spacing scale.
 *
 * The whole app is built on an 8pt grid (`GRID = 8`), so this scale is
 * just `GRID * n` with short names. Use these tokens instead of raw
 * numbers in new code so padding/margins stay consistent.
 */

export const GRID = 8;

export const spacing = {
  /** 0 */
  none: 0,
  /** 2 */
  hair: GRID / 4,
  /** 4 */
  xxs: GRID / 2,
  /** 8 */
  xs: GRID,
  /** 12 */
  sm: GRID * 1.5,
  /** 16 */
  md: GRID * 2,
  /** 20 */
  mdLg: GRID * 2.5,
  /** 24 */
  lg: GRID * 3,
  /** 32 */
  xl: GRID * 4,
  /** 40 */
  xxl: GRID * 5,
  /** 48 */
  xxxl: GRID * 6,
  /** 64 */
  huge: GRID * 8,
} as const;

export type SpacingToken = keyof typeof spacing;
