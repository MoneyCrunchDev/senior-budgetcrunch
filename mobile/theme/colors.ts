/**
 * MoneyCrunch color tokens.
 *
 * Source of truth for the five “Realtime Colors” reference hexes
 * (forest green + cream on charcoal):
 *   --text: #fdfbd4
 *   --background: #1f1f1f
 *   --primary: #00573F
 *   --secondary: #466a3b
 *   --accent: #6eae72
 *
 * The app is **dark-first**: semantic tokens below assume cream text on
 * `#1f1f1f` with elevated charcoal surfaces. Screens import from `colors` /
 * `@/theme` only — never hard-code these hexes in components.
 */

export const brand = {
  /** #fdfbd4 — soft cream, primary text on app surfaces. */
  text: "#fdfbd4",
  /** #1f1f1f — app canvas / screen background. */
  background: "#1f1f1f",
  /** #00573F — forest green, primary actions / emphasis. */
  primary: "#00573F",
  /** #466a3b — olive green, secondary actions / subdued emphasis. */
  secondary: "#466a3b",
  /** #6eae72 — leaf green, highlights / links / success accents on dark. */
  accent: "#6eae72",
} as const;

/**
 * Tints for buttons and **dark** surfaces (muted fills on charcoal — not pastels).
 */
export const brandTints = {
  primaryHover: "#006b4d",
  primaryDark: "#003d2c",
  /** Muted green lift for selected rows / chips on dark. */
  primarySoft: "rgba(0, 87, 63, 0.35)",
  primarySoftBorder: "rgba(110, 174, 114, 0.45)",
  accentSoft: "rgba(70, 106, 59, 0.45)",
  accentSoftBorder: "rgba(110, 174, 114, 0.35)",
} as const;

/** Legacy neutrals — still used for one-off tints; prefer semantic `colors` in UI. */
export const neutral = {
  0: "#FFFFFF",
  50: "#F8F9FB",
  75: "#F6F7F9",
  100: "#EEF0F3",
  150: "#E6E8EC",
  200: "#D8DCE2",
  300: "#C7C7CC",
  400: "#9CA3AF",
  500: "#6B7280",
  600: "#4B5563",
  700: "#374151",
  800: "#1F2937",
  900: "#111827",
  950: "#0A0A0A",
} as const;

/** Base status hues; `colors` below maps dark-appropriate soft fills. */
export const status = {
  successStrong: "#8fd8a1",
  success: "#6eae72",
  successSoft: "rgba(110, 174, 114, 0.18)",
  successBorder: "rgba(110, 174, 114, 0.45)",
  successText: "#b7e7bf",

  dangerStrong: "#B71C1C",
  danger: "#E57373",
  dangerSoft: "rgba(183, 28, 28, 0.2)",
  dangerBorder: "rgba(230, 115, 115, 0.4)",
  dangerText: "#f5b5b5",

  warningStrong: "#E6B325",
  warning: "#E6B325",
  warningSoft: "rgba(230, 179, 37, 0.15)",

  info: "#7EB8FF",
  infoSoft: "rgba(3, 122, 255, 0.15)",
} as const;

/**
 * Semantic tokens — **dark theme default** (cream on charcoal).
 */
export const colors = {
  // Surfaces
  screenBackground: brand.background,
  /** Cards / panels above the canvas. */
  surface: "#262626",
  surfaceAlt: "#2a2a2a",
  surfaceSubtle: "#2d2d2d",
  surfaceMuted: "#222222",
  surfaceBrand: "rgba(0, 87, 63, 0.25)",
  /** Rare “inverse” block (e.g. marketing) — true brand dark. */
  surfaceInverse: brand.background,

  // Text (cream hierarchy on dark)
  textPrimary: brand.text,
  textSecondary: "#eee9c8",
  textMuted: "#dfd9b6",
  textPlaceholder: "#cec89f",
  textOnBrand: brand.text,
  /** Filled primary button: cream on forest green. */
  textOnPrimary: brand.text,

  // Borders & dividers
  border: "#3a3a3a",
  borderStrong: "#4a4a4a",
  divider: "#333333",

  // Brand
  primary: brand.primary,
  primaryHover: brandTints.primaryHover,
  primaryDark: brandTints.primaryDark,
  primarySoft: brandTints.primarySoft,
  primarySoftBorder: brandTints.primarySoftBorder,

  secondary: brand.secondary,
  accent: brand.accent,
  accentSoft: brandTints.accentSoft,
  accentSoftBorder: brandTints.accentSoftBorder,

  /** Inline actions — leaf green reads on charcoal. */
  link: brand.accent,

  // Status (tuned for dark surfaces)
  success: status.success,
  successStrong: status.successStrong,
  successSoft: status.successSoft,
  successBorder: status.successBorder,
  successText: status.successText,

  danger: status.danger,
  dangerStrong: status.dangerStrong,
  dangerSoft: status.dangerSoft,
  dangerBorder: status.dangerBorder,
  dangerText: status.dangerText,

  warning: status.warning,
  warningStrong: status.warningStrong,
  warningSoft: status.warningSoft,

  info: status.info,
  infoSoft: status.infoSoft,

  // Misc
  sheetHandle: "#5c5c5c",
  overlay: "rgba(0,0,0,0.6)",
  overlaySoft: "rgba(0,0,0,0.45)",
  overlayLight: "rgba(31, 31, 31, 0.92)",

  shadow: "#000000",
  transparent: "transparent",
} as const;

export type ColorToken = keyof typeof colors;
