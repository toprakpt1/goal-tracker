import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/app-text';
import { strings } from '@/i18n/strings';
import { radius, spacing, useTheme } from '@/theme';

interface UndoToastProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  style?: StyleProp<ViewStyle>;
}

export function UndoToast({ visible, message, onUndo, style }: UndoToastProps) {
  const theme = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrap, style]}>
      <View style={[styles.toast, { backgroundColor: theme.text }]}>
        <AppText variant="bodyStrong" color={theme.background} style={styles.message} numberOfLines={2}>
          {message}
        </AppText>
        <Pressable
          onPress={onUndo}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <AppText variant="bodyStrong" color={theme.background} style={styles.actionText}>
            {strings.common.undo}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xxl,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  message: {
    flex: 1,
  },
  action: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  actionText: {
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.6,
  },
});
