export interface Theme {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  track: string;
  overlay: string;
  isDark: boolean;
}

/**
 * Ember, the warm dark palette. Goal Tracker ships with a single appearance so
 * the amber light and cream type always land on the same roasted neutrals.
 */
export const darkTheme: Theme = {
  background: '#120E0B',
  surface: '#1C1612',
  surfaceMuted: '#251D17',
  surfaceElevated: '#2B211A',
  text: '#F6EDE3',
  textMuted: '#B3A192',
  border: '#352A21',
  primary: '#F5A524',
  onPrimary: '#241505',
  secondary: '#FF7A59',
  success: '#5AD18A',
  warning: '#F5A524',
  danger: '#FF6B6B',
  track: '#2E241C',
  overlay: 'rgba(10, 7, 5, 0.72)',
  isDark: true,
};

export const gradients = {
  ember: ['#F5A524', '#FF7A59'] as const,
  emberDown: ['#FF7A59', '#F5A524'] as const,
  glow: ['rgba(245, 165, 36, 0.14)', 'rgba(18, 14, 11, 0)'] as const,
  hero: ['rgba(245, 165, 36, 0.16)', 'rgba(43, 33, 26, 0)'] as const,
};

export const fontFamily = {
  display: 'Domine_600SemiBold',
  displayRegular: 'Domine_400Regular',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

/** Warm tracker palette: amber, coral, rose, olive, teal-green. No blue or purple. */
export const trackerPalette = [
  '#F5A524',
  '#FF8A3D',
  '#FF7A59',
  '#E8573F',
  '#D9467A',
  '#A3E635',
  '#5AD18A',
  '#2DD4BF',
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export function useTheme(): Theme {
  // Kept as a hook so screens stay ready for a future light mode, but Ember is
  // intentionally dark-only and ignores the system scheme.
  return darkTheme;
}
