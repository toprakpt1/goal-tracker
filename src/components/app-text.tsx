import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'number'
  | 'tab';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  const theme = useTheme();

  return <Text {...rest} style={[styles[variant], { color: color ?? theme.text }, style]} />;
}

const styles = StyleSheet.create({
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heading: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  number: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tab: {
    fontSize: 11,
    fontWeight: '600',
  },
});
