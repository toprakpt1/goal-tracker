import { StyleSheet, Text, type TextProps } from 'react-native';

import { fontFamily, useTheme } from '@/theme';

export type TextVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'metric'
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
  hero: {
    fontFamily: fontFamily.display,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1,
  },
  display: {
    fontFamily: fontFamily.display,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  metric: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  heading: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  bodyStrong: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamily.sansBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  number: {
    fontFamily: fontFamily.sansBold,
    fontSize: 15,
    lineHeight: 21,
    fontVariant: ['tabular-nums'],
  },
  tab: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
  },
});
