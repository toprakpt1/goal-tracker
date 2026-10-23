import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ProgressBar } from '@/components/progress-bar';
import { TrackerIcon } from '@/components/tracker-icon';
import type { Progress } from '@/domain/progress';
import type { GoalWithTracker } from '@/domain/types';
import { withAlpha } from '@/lib/color';
import { formatAmount } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

interface GoalRowProps {
  goal: GoalWithTracker;
  progress: Progress;
  onPress?: () => void;
}

export function GoalRow({ goal, progress, onPress }: GoalRowProps) {
  const theme = useTheme();
  const color = goal.tracker.color ?? theme.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${goal.tracker.name}, ${formatAmount(progress.total)} of ${formatAmount(
        progress.target,
      )} ${goal.tracker.unit}`}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={[styles.iconChip, { backgroundColor: withAlpha(color, 0.14) }]}>
          <TrackerIcon icon={goal.tracker.icon} size={15} color={color} />
        </View>

        <View style={styles.titleBlock}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {goal.tracker.name}
          </AppText>
          <AppText variant="caption" color={theme.textMuted}>
            {formatAmount(progress.total)} / {formatAmount(progress.target)} {goal.tracker.unit}
          </AppText>
        </View>

        {progress.isComplete ? (
          <Ionicons name="checkmark-circle" size={20} color={theme.success} />
        ) : (
          <AppText variant="number" color={theme.textMuted}>
            {formatAmount(progress.percent)}%
          </AppText>
        )}
      </View>

      <ProgressBar ratio={progress.ratio} color={color} height={5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
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
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 1,
  },
});
