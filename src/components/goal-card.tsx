import { Ionicons } from '@expo/vector-icons';
import Plus from 'lucide-react-native/icons/plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ProgressBar } from '@/components/progress-bar';
import { TrackerIcon } from '@/components/tracker-icon';
import type { Progress } from '@/domain/progress';
import type { GoalWithTracker } from '@/domain/types';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { formatAmount, formatProgressLine } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

interface GoalCardProps {
  goal: GoalWithTracker;
  progress: Progress;
  onPress?: () => void;
  onQuickAdd?: () => void;
}

export function GoalCard({ goal, progress, onPress, onQuickAdd }: GoalCardProps) {
  const theme = useTheme();
  const color = goal.tracker.color ?? theme.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${goal.tracker.name}, ${formatProgressLine(
        progress.total,
        progress.target,
        goal.tracker.unit,
      )}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        progress.isComplete && styles.completed,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconChip, { backgroundColor: withAlpha(color, 0.14) }]}>
          <TrackerIcon icon={goal.tracker.icon} size={21} color={color} />
        </View>

        <View style={styles.titleBlock}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {goal.tracker.name}
          </AppText>
          <AppText variant="caption" color={theme.textMuted}>
            {strings.periods[goal.period]} · {goal.tracker.unit}
          </AppText>
        </View>

        {progress.isComplete ? (
          <View style={[styles.doneBadge, { backgroundColor: withAlpha(theme.success, 0.14) }]}>
            <Ionicons name="checkmark-circle" size={15} color={theme.success} />
            <AppText variant="caption" color={theme.success} style={styles.doneText}>
              {strings.today.done}
            </AppText>
          </View>
        ) : (
          <AppText variant="bodyStrong" color={theme.textMuted}>
            {formatAmount(progress.percent)}%
          </AppText>
        )}
      </View>

      <ProgressBar ratio={progress.ratio} color={color} />

      <View style={styles.footer}>
        <AppText variant="number">
          {formatProgressLine(progress.total, progress.target, goal.tracker.unit)}
        </AppText>

        <View style={styles.footerRight}>
          <AppText variant="caption" color={progress.isComplete ? theme.success : theme.textMuted}>
            {progress.isComplete
              ? `${formatAmount(progress.percent)}%`
              : strings.today.remaining(formatAmount(progress.remaining), goal.tracker.unit)}
          </AppText>

          {onQuickAdd ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onQuickAdd();
              }}
              accessibilityRole="button"
              accessibilityLabel={strings.today.quickAdd(
                formatAmount(goal.tracker.defaultStep),
                goal.tracker.unit,
              )}
              hitSlop={6}
              style={({ pressed }) => [
                styles.quickAdd,
                { backgroundColor: withAlpha(color, 0.14) },
                pressed && styles.pressed,
              ]}
            >
              <Plus size={16} color={color} strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  completed: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  doneText: {
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickAdd: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
