import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { strings } from '@/i18n/strings';
import { radius, spacing, useTheme } from '@/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function PageHeader({ title, subtitle, onBack, right }: PageHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={strings.common.back}
          hitSlop={10}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </Pressable>
      ) : null}

      <View style={styles.titleBlock}>
        <AppText variant="title" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={theme.textMuted} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingBottom: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  spacer: {
    width: 44,
  },
  pressed: {
    opacity: 0.7,
  },
});
