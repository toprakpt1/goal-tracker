import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ProgressBar } from '@/components/progress-bar';
import type { Progress } from '@/domain/progress';
import type { GoalWithTracker } from '@/domain/types';
import { withAlpha } from '@/lib/color';
import { formatAmount } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

interface GoalRowProps {
  goal: GoalWithTracker;
  progress: Progress;
}

export function GoalRow({ goal, progress }: GoalRowProps) {
  const theme = useTheme();
  const color = goal.tracker.color ?? theme.primary;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.iconChip, { backgroundColor: withAlpha(color, 0.14) }]}>
          <Text style={styles.icon}>{goal.tracker.icon ?? '🎯'}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
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
  icon: {
    fontSize: 15,
  },
  titleBlock: {
    flex: 1,
    gap: 1,
  },
});
