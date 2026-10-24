import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { PrimaryButton } from '@/components/primary-button';
import { TrackerIcon } from '@/components/tracker-icon';
import type { NewCompletion } from '@/db/logging';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { formatAmount } from '@/lib/format';
import { radius, spacing, trackerPalette, useTheme } from '@/theme';

interface CompletionCelebrationProps {
  completions: readonly NewCompletion[];
  onClose: () => void;
}

/**
 * A one-off celebration shown after a log completes one or more goals. The
 * parent only renders it when there is a new completion, and dismissing it is
 * what releases the delayed undo toast.
 */
export function CompletionCelebration({ completions, onClose }: CompletionCelebrationProps) {
  const theme = useTheme();

  if (completions.length === 0) {
    return null;
  }

  const multiple = completions.length > 1;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={strings.common.close}
        />

        <View
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityViewIsModal
        >
          <View style={styles.confetti} pointerEvents="none">
            {trackerPalette.slice(0, 7).map((confettiColor, index) => (
              <View
                key={`${confettiColor}-${index}`}
                style={[
                  styles.confettiDot,
                  {
                    backgroundColor: withAlpha(confettiColor, 0.55),
                    width: index % 2 === 0 ? 8 : 6,
                    height: index % 2 === 0 ? 8 : 6,
                    transform: [{ translateY: index % 3 === 0 ? 2 : -2 }],
                  },
                ]}
              />
            ))}
          </View>

          <View style={[styles.badge, { backgroundColor: withAlpha(theme.success, 0.14) }]}>
            <Ionicons name="checkmark" size={42} color={theme.success} />
          </View>

          <View style={styles.heading}>
            <AppText variant="title" style={styles.centerText}>
              {multiple ? strings.celebration.titleMultiple : strings.celebration.title}
            </AppText>
            <AppText variant="body" color={theme.textMuted} style={styles.centerText}>
              {multiple
                ? strings.celebration.subtitleMultiple
                : strings.celebration.subtitle}
            </AppText>
          </View>

          <View style={styles.list}>
            {completions.map((item) => {
              const color = item.goal.tracker.color ?? theme.primary;
              return (
                <View
                  key={`${item.goal.id}:${item.range.key}`}
                  style={[styles.row, { backgroundColor: theme.surfaceMuted }]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: withAlpha(color, 0.16) }]}>
                    <TrackerIcon icon={item.goal.tracker.icon} size={20} color={color} />
                  </View>
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {item.goal.tracker.name}
                    </AppText>
                    <AppText variant="caption" color={theme.textMuted} numberOfLines={1}>
                      {strings.periods[item.goal.period]} ·{' '}
                      {item.goal.tracker.kind === 'check'
                        ? strings.check.done
                        : strings.celebration.target(
                            formatAmount(item.progress.total),
                            formatAmount(item.progress.target),
                            item.goal.tracker.unit,
                          )}
                    </AppText>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                </View>
              );
            })}
          </View>

          <PrimaryButton label={strings.celebration.keepGoing} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  confetti: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 10,
  },
  confettiDot: {
    borderRadius: radius.pill,
  },
  badge: {
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    gap: spacing.xs,
  },
  centerText: {
    textAlign: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
