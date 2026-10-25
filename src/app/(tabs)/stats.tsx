import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { StatTile } from '@/components/stat-tile';
import { TrackerIcon } from '@/components/tracker-icon';
import { loadStats, type GoalStreak } from '@/db/stats';
import { getGoalScopeLabel } from '@/domain/scope';
import type { Tracker } from '@/domain/types';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/hooks/use-settings';
import { useToday } from '@/hooks/use-today';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { radius, spacing, useTheme } from '@/theme';

interface StreakGroup {
  tracker: Tracker;
  rows: GoalStreak[];
}

export default function StatsScreen() {
  const theme = useTheme();
  const today = useToday();
  const settings = useSettings();

  const dateKey = format(today, 'yyyy-MM-dd');
  const { data, error, loading } = useDbQuery(
    (database) => loadStats(database, today, settings.weekStartsOn),
    `${dateKey}:${settings.weekStartsOn}`,
  );

  const groups = useMemo(() => {
    const result: StreakGroup[] = [];

    for (const row of data?.goals ?? []) {
      const existing = result.find((group) => group.tracker.id === row.goal.trackerId);
      if (existing) {
        existing.rows.push(row);
      } else {
        result.push({ tracker: row.goal.tracker, rows: [row] });
      }
    }

    return result;
  }, [data]);

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="display">{strings.stats.title}</AppText>
        <AppText variant="body" color={theme.textMuted}>
          {strings.stats.subtitle}
        </AppText>
      </View>

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Could not load your stats"
          body={error.message}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="stats-chart-outline"
          title={strings.stats.emptyTitle}
          body={strings.stats.emptyBody}
          actionLabel={strings.stats.emptyAction}
          onAction={() => router.push('/goal/new')}
        />
      ) : (
        <>
          <View style={styles.statRow}>
            <StatTile
              label={strings.stats.activeStreaks}
              value={data?.activeStreaks ?? 0}
              accent={theme.primary}
              icon={<Ionicons name="flame" size={17} color={theme.primary} />}
            />
            <StatTile
              label={strings.stats.trackedGoals}
              value={data?.goals.length ?? 0}
              accent={theme.secondary}
              icon={<Ionicons name="flag" size={16} color={theme.secondary} />}
            />
            <StatTile
              label={strings.stats.completedLabel}
              value={(data?.goals ?? []).reduce((sum, row) => sum + row.total, 0)}
              accent={theme.success}
              icon={<Ionicons name="checkmark" size={18} color={theme.success} />}
            />
          </View>

          <View style={styles.groups}>
            {groups.map(({ tracker, rows }) => {
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
                      <TrackerIcon icon={tracker.icon} size={20} color={color} />
                    </View>
                    <View style={styles.cardTitle}>
                      <AppText variant="heading" numberOfLines={1}>
                        {tracker.name}
                      </AppText>
                      <AppText variant="caption" color={theme.textMuted}>
                        {tracker.kind === 'check' ? strings.check.checklist : tracker.unit}
                      </AppText>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={styles.rows}>
                    {rows.map((row) => {
                      const unit = strings.streak.units[row.goal.period];
                      const scopeLabel = getGoalScopeLabel(row.goal, settings.weekStartsOn);
                      return (
                        <Pressable
                          key={row.goal.id}
                          onPress={() =>
                            router.push({ pathname: '/goal/[id]', params: { id: row.goal.id } })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`${tracker.name}, ${strings.periods[row.goal.period]}${
                            scopeLabel ? `, ${scopeLabel}` : ''
                          }`}
                          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                        >
                          <View style={styles.rowText}>
                            <AppText variant="bodyStrong">
                              {strings.periods[row.goal.period]}
                            </AppText>
                            {scopeLabel ? (
                              <AppText
                                variant="caption"
                                color={theme.textMuted}
                                numberOfLines={1}
                              >
                                {scopeLabel}
                              </AppText>
                            ) : null}
                            <AppText variant="caption" color={theme.textMuted}>
                              {strings.stats.completedPeriods(row.total)}
                            </AppText>
                          </View>

                          <View style={styles.rowRight}>
                            <AppText
                              variant="bodyStrong"
                              color={row.current > 0 ? theme.text : theme.textMuted}
                            >
                              {row.current > 0
                                ? strings.streak.value(row.current, unit)
                                : strings.stats.noStreak}
                            </AppText>
                            <AppText variant="caption" color={theme.textMuted}>
                              {strings.stats.best(strings.streak.value(row.best, unit))}
                            </AppText>
                          </View>

                          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  header: {
    gap: 4,
  },
  center: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  groups: {
    gap: spacing.md,
    marginTop: spacing.md,
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
  rows: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
