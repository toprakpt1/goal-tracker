import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { radius, spacing, useTheme } from '@/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, body, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.surfaceMuted }]}>
        <Ionicons name={icon} size={26} color={theme.primary} />
      </View>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="body" color={theme.textMuted} style={styles.center}>
        {body}
      </AppText>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: theme.primary },
            pressed && styles.pressed,
          ]}
        >
          <AppText variant="bodyStrong" color={theme.onPrimary}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.8,
  },
});
