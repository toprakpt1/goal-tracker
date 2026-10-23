import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { listGoalsWithTracker } from '@/db/repositories/goals';
import type { GoalWithTracker, Tracker } from '@/domain/types';
import { useDbQuery } from '@/hooks/use-db-query';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { formatAmount } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

interface GoalGroup {
  tracker: Tracker;
  goals: GoalWithTracker[];
}

export default function GoalsScreen() {
  const theme = useTheme();
  const { data, error, loading } = useDbQuery(
    (database) => listGoalsWithTracker(database),
    'goals',
  );

  const groups = useMemo(() => {
    const result: GoalGroup[] = [];
    for (const goal of data ?? []) {
      const existing = result.find((group) => group.tracker.id === goal.trackerId);
      if (existing) {
        existing.goals.push(goal);
      } else {
        result.push({ tracker: goal.tracker, goals: [goal] });
      }
    }
    return result;
  }, [data]);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="display">{strings.goals.title}</AppText>
        <AppText variant="body" color={theme.textMuted}>
          {strings.goals.subtitle}
        </AppText>
      </View>

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Could not load your goals"
          body={error.message}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="flag-outline"
          title={strings.goals.emptyTitle}
          body={strings.goals.emptyBody}
        />
      ) : (
        <View style={styles.groups}>
          {groups.map(({ tracker, goals }) => {
            const color = tracker.color ?? theme.primary;
            return (
              <View
                key={tracker.id}
                style={[
                  styles.card,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconChip, { backgroundColor: withAlpha(color, 0.14) }]}>
                    <AppText style={styles.icon}>{tracker.icon ?? '🎯'}</AppText>
                  </View>
                  <View style={styles.cardTitle}>
                    <AppText variant="heading">{tracker.name}</AppText>
                    <AppText variant="caption" color={theme.textMuted}>
                      {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
                    </AppText>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.goalList}>
                  {goals.map((goal) => (
                    <View key={goal.id} style={styles.goalRow}>
                      <AppText variant="body" color={theme.textMuted} style={styles.period}>
                        {strings.periods[goal.period]}
                      </AppText>
                      <AppText variant="bodyStrong">
                        {formatAmount(goal.target)} {tracker.unit}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  center: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  groups: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  cardTitle: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  goalList: {
    gap: spacing.sm,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  period: {
    flex: 1,
  },
});
