import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { TrackerIcon } from '@/components/tracker-icon';
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
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="display">{strings.goals.title}</AppText>
          <AppText variant="body" color={theme.textMuted}>
            {strings.goals.subtitle}
          </AppText>
        </View>

        <Pressable
          onPress={() => router.push('/goal/new')}
          accessibilityRole="button"
          accessibilityLabel={strings.goals.add}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.primary },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add" size={18} color={theme.onPrimary} />
          <AppText variant="bodyStrong" color={theme.onPrimary}>
            {strings.goals.add}
          </AppText>
        </Pressable>
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
          actionLabel={strings.goals.add}
          onAction={() => router.push('/goal/new')}
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
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/tracker/[id]', params: { id: tracker.id } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${strings.common.edit} ${tracker.name}`}
                  style={({ pressed }) => [styles.cardHeader, pressed && styles.pressed]}
                >
                  <View style={[styles.iconChip, { backgroundColor: withAlpha(color, 0.14) }]}>
                    <TrackerIcon icon={tracker.icon} size={20} color={color} />
                  </View>
                  <View style={styles.cardTitle}>
                    <AppText variant="heading" numberOfLines={1}>
                      {tracker.name}
                    </AppText>
                    <AppText variant="caption" color={theme.textMuted}>
                      {strings.goals.goalCount(goals.length)} ·{' '}
                      {tracker.kind === 'check' ? strings.check.checklist : tracker.unit}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </Pressable>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.goalList}>
                  {goals.map((goal) => (
                    <Pressable
                      key={goal.id}
                      onPress={() =>
                        router.push({ pathname: '/goal/[id]', params: { id: goal.id } })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${tracker.name}, ${strings.periods[goal.period]}`}
                      style={({ pressed }) => [styles.goalRow, pressed && styles.pressed]}
                    >
                      <AppText variant="body" color={theme.textMuted} style={styles.period}>
                        {strings.periods[goal.period]}
                      </AppText>
                      <AppText variant="bodyStrong">
                        {tracker.kind === 'check'
                          ? strings.check.checklist
                          : `${formatAmount(goal.target)} ${tracker.unit}`}
                      </AppText>
                      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                    </Pressable>
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
  content: {
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.7,
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
  cardTitle: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  goalList: {
    gap: spacing.xs,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  period: {
    flex: 1,
  },
});
