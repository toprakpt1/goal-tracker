import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { radius, spacing, useTheme } from '@/theme';

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: string;
  hint?: string;
}

export function StatTile({ label, value, icon, accent, hint }: StatTileProps) {
  const theme = useTheme();
  const tint = accent ?? theme.primary;

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {icon ? (
        <View style={[styles.iconChip, { backgroundColor: `${tint}22` }]}>{icon}</View>
      ) : null}
      <AppText variant="metric" style={styles.value}>
        {value}
      </AppText>
      <AppText variant="caption" color={theme.textMuted} numberOfLines={1}>
        {label}
      </AppText>
      {hint ? (
        <AppText variant="caption" color={theme.textMuted} numberOfLines={1}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 112,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 26,
    lineHeight: 32,
  },
});
