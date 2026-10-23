import { useColorScheme } from 'react-native';

export interface Theme {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  track: string;
  overlay: string;
  isDark: boolean;
}

export const lightTheme: Theme = {
  background: '#F6F5FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEEBF7',
  text: '#17151F',
  textMuted: '#6E6A7C',
  border: '#E4E1EE',
  primary: '#6C4CF1',
  onPrimary: '#FFFFFF',
  success: '#0E9F6E',
  warning: '#D97706',
  danger: '#DC2626',
  track: '#E9E6F4',
  overlay: 'rgba(23, 21, 31, 0.45)',
  isDark: false,
};

export const darkTheme: Theme = {
  background: '#0D0C12',
  surface: '#17151F',
  surfaceMuted: '#211E2D',
  text: '#F5F3FA',
  textMuted: '#9C97AD',
  border: '#2B2737',
  primary: '#8B6CFF',
  onPrimary: '#FFFFFF',
  success: '#2DD4A0',
  warning: '#FBBF24',
  danger: '#FF6B6B',
  track: '#2B2737',
  overlay: 'rgba(0, 0, 0, 0.62)',
  isDark: true,
};

export const trackerPalette = [
  '#6C4CF1',
  '#2F80ED',
  '#0FA3A3',
  '#0E9F6E',
  '#D97706',
  '#F25C54',
  '#D63AF9',
  '#E0457B',
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
