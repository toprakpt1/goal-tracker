import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CheckToggle } from '@/components/check-toggle';
import { ProgressBar } from '@/components/progress-bar';
import { TrackerIcon } from '@/components/tracker-icon';
import type { Progress } from '@/domain/progress';
import type { GoalWithTracker } from '@/domain/types';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { formatAmount } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

interface GoalRowProps {
  goal: GoalWithTracker;
  progress: Progress;
  onPress?: () => void;
  onToggle?: () => void;
}

export function GoalRow({ goal, progress, onPress, onToggle }: GoalRowProps) {
  const theme = useTheme();
  const color = goal.tracker.color ?? theme.primary;
  const isCheck = goal.tracker.kind === 'check';
  const accessibilityLabel = isCheck
    ? `${goal.tracker.name}, ${strings.periods[goal.period]}, ${
        progress.isComplete ? strings.check.done : strings.check.notDone
      }`
    : `${goal.tracker.name}, ${formatAmount(progress.total)} of ${formatAmount(
        progress.target,
      )} ${goal.tracker.unit}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={[styles.iconChip, { backgroundColor: withAlpha(color, 0.15) }]}>
          <TrackerIcon icon={goal.tracker.icon} size={15} color={color} />
        </View>

        <View style={styles.titleBlock}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {goal.tracker.name}
          </AppText>
          <AppText variant="caption" color={theme.textMuted} numberOfLines={1}>
            {isCheck
              ? `${strings.periods[goal.period]} · ${
                  progress.isComplete ? strings.check.done : strings.check.notDone
                }`
              : `${formatAmount(progress.total)} / ${formatAmount(progress.target)} ${
                  goal.tracker.unit
                }`}
          </AppText>
        </View>

        {isCheck ? (
          <CheckToggle
            checked={progress.isComplete}
            size={30}
            label={progress.isComplete ? strings.check.markUndone : strings.check.markDone}
            disabled={!onToggle}
            onPress={(event) => {
              event.stopPropagation();
              onToggle?.();
            }}
          />
        ) : progress.isComplete ? (
          <Ionicons name="checkmark-circle" size={20} color={theme.success} />
        ) : (
          <AppText variant="number" color={theme.textMuted}>
            {formatAmount(progress.percent)}%
          </AppText>
        )}
      </View>

      {isCheck ? null : <ProgressBar ratio={progress.ratio} height={5} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  pressed: {
    opacity: 0.65,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 1,
  },
});
