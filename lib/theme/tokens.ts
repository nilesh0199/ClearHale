/**
 * Clearhale Design Tokens
 * Single source of truth for the neutral palette, semantic tokens, and non-neutral accents.
 */

export const LIGHT_PALETTE = {
  base: '#FFFFFF',
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#A3A3A3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0A0A0A',
} as const;

export const DARK_PALETTE = {
  base: '#000000',
  50: '#0A0A0A',
  100: '#171717',
  200: '#262626',
  300: '#373737',
  400: '#525252',
  500: '#8A8A8A',
  600: '#A3A3A3',
  700: '#D4D4D4',
  800: '#E5E5E5',
  900: '#F5F5F5',
  950: '#FAFAFA',
} as const;

export const SEMANTIC_LIGHT = {
  pageBg: LIGHT_PALETTE[50],          // #FAFAFA
  surface: LIGHT_PALETTE.base,         // #FFFFFF
  subtleFill: LIGHT_PALETTE[100],      // #F5F5F5
  border: LIGHT_PALETTE[200],          // #E5E5E5
  strongBorder: LIGHT_PALETTE[300],    // #D4D4D4
  primaryText: LIGHT_PALETTE[900],     // #171717
  secondaryText: LIGHT_PALETTE[600],   // #525252
  tertiaryText: LIGHT_PALETTE[500],    // #737373 (large or non-essential only)
  disabledText: LIGHT_PALETTE[400],    // #A3A3A3 (never for readable text)
} as const;

export const SEMANTIC_DARK = {
  pageBg: DARK_PALETTE[50],            // #0A0A0A
  pageBgTrueBlack: DARK_PALETTE.base,  // #000000
  surface: DARK_PALETTE[100],          // #171717
  raisedSurface: DARK_PALETTE[200],    // #262626
  subtleFill: DARK_PALETTE[200],       // #262626
  border: DARK_PALETTE[200],           // #262626
  strongBorder: DARK_PALETTE[300],     // #373737
  primaryText: DARK_PALETTE[900],      // #F5F5F5
  secondaryText: DARK_PALETTE[600],    // #A3A3A3
  tertiaryText: DARK_PALETTE[500],     // #8A8A8A
  disabledText: DARK_PALETTE[400],     // #525252
} as const;

/**
 * Strictly allowed non-neutral colors:
 * (a) Air quality band colors (ring, band chips, forecast cells, share card)
 * (b) Danger red (emergency card, Myth label)
 * (c) Accent colors (teal vs mono)
 */
export const AQI_BAND_COLORS = {
  good: {
    hex: '#10B981',
    lightTint: 'rgba(16, 185, 129, 0.12)',
    darkTint: 'rgba(52, 211, 153, 0.14)',
  },
  satisfactory: {
    hex: '#84CC16',
    lightTint: 'rgba(132, 204, 22, 0.12)',
    darkTint: 'rgba(163, 230, 53, 0.14)',
  },
  moderate: {
    hex: '#F59E0B',
    lightTint: 'rgba(245, 158, 11, 0.12)',
    darkTint: 'rgba(251, 191, 36, 0.14)',
  },
  poor: {
    hex: '#F97316',
    lightTint: 'rgba(249, 115, 22, 0.12)',
    darkTint: 'rgba(251, 146, 60, 0.14)',
  },
  very_poor: {
    hex: '#EF4444',
    lightTint: 'rgba(239, 68, 68, 0.12)',
    darkTint: 'rgba(248, 113, 113, 0.14)',
  },
  severe: {
    hex: '#881337',
    lightTint: 'rgba(136, 19, 55, 0.12)',
    darkTint: 'rgba(251, 113, 133, 0.16)',
  },
} as const;

export const DANGER_COLOR = {
  red: '#DC2626',
  lightBg: '#FEF2F2',
  darkBg: 'rgba(220, 38, 38, 0.15)',
} as const;

export const ACCENT_COLORS = {
  teal: {
    light: '#0D5C52',
    lightHover: '#09473F',
    lightSubtle: '#EAF5F3',
    dark: '#2DD4BF',
    darkHover: '#14B8A6',
    darkSubtle: '#16332E',
  },
  mono: {
    lightButton: LIGHT_PALETTE[900],     // #171717
    lightButtonText: LIGHT_PALETTE.base, // #FFFFFF
    darkButton: DARK_PALETTE[900],       // #F5F5F5
    darkButtonText: DARK_PALETTE[950],   // #FAFAFA
  },
} as const;

export type AccentMode = 'teal' | 'mono';
