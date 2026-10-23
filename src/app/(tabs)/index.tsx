import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { GoalCard } from '@/components/goal-card';
import { GoalRow } from '@/components/goal-row';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { loadDashboard } from '@/db/dashboard';
import { seedDemoData } from '@/db/seed';
import { getGoalProgress, type Progress } from '@/domain/progress';
import type { GoalWithTracker, Period } from '@/domain/types';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/hooks/use-settings';
import { useToday } from '@/hooks/use-today';
import { strings } from '@/i18n/strings';
import { formatDateHeading, greetingFor } from '@/lib/format';
import { notifyDataChanged } from '@/store/db';
import { radius, spacing, useTheme } from '@/theme';

const SECTION_PERIODS: Period[] = ['weekly', 'monthly', 'yearly'];

export default function TodayScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const today = useToday();
  const settings = useSettings();
  const [seeding, setSeeding] = useState(false);
  const [expanded, setExpanded] = useState<Record<Period, boolean>>({
    daily: true,
    weekly: true,
    monthly: false,
    yearly: false,
  });

  const dateKey = format(today, 'yyyy-MM-dd');
  const { data, error, loading } = useDbQuery(
    (database) => loadDashboard(database, today, settings.weekStartsOn),
    `${dateKey}:${settings.weekStartsOn}`,
  );

  const goalsByPeriod = useMemo(() => {
    const grouped: Record<Period, GoalWithTracker[]> = {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    };
    for (const goal of data?.goals ?? []) {
      grouped[goal.period].push(goal);
    }
    return grouped;
  }, [data]);

  const progressFor = (goal: GoalWithTracker): Progress =>
    getGoalProgress(
      goal,
      data?.logsByTracker.get(goal.trackerId) ?? [],
      today,
      settings.weekStartsOn,
    );

  async function handleSeed() {
    setSeeding(true);
    try {
      const result = await seedDemoData(db);
      if (result.created) {
        notifyDataChanged();
      }
    } catch (seedError) {
      Alert.alert(
        'Could not load example data',
        seedError instanceof Error ? seedError.message : String(seedError),
      );
    } finally {
      setSeeding(false);
    }
  }

  const hasGoals = (data?.goals.length ?? 0) > 0;
  const dailyGoals = goalsByPeriod.daily;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="caption" color={theme.textMuted}>
            {greetingFor(today)}
          </AppText>
          <AppText variant="display">{formatDateHeading(today)}</AppText>
        </View>

        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel={strings.settings.title}
          hitSlop={10}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="settings-outline" size={20} color={theme.text} />
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
      ) : !hasGoals ? (
        <EmptyState
          icon="sparkles-outline"
          title={strings.today.emptyTitle}
          body={strings.today.emptyBody}
          actionLabel={__DEV__ ? strings.today.emptyAction : undefined}
          onAction={__DEV__ ? handleSeed : undefined}
        />
      ) : (
        <>
          <View style={styles.section}>
            <View style={styles.titleRow}>
              <AppText variant="heading">{strings.today.title}</AppText>
              <AppText variant="caption" color={theme.textMuted}>
                {dailyGoals.length}
              </AppText>
            </View>

            {dailyGoals.length === 0 ? (
              <AppText variant="body" color={theme.textMuted}>
                {strings.goals.emptyBody}
              </AppText>
            ) : (
              <View style={styles.cards}>
                {dailyGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} progress={progressFor(goal)} />
                ))}
              </View>
            )}
          </View>

          {SECTION_PERIODS.map((period) => {
            const goals = goalsByPeriod[period];
            if (goals.length === 0) {
              return null;
            }

            const isExpanded = expanded[period];
            return (
              <View key={period} style={styles.section}>
                <SectionHeader
                  title={
                    period === 'weekly'
                      ? strings.today.thisWeek
                      : period === 'monthly'
                        ? strings.today.thisMonth
                        : strings.today.thisYear
                  }
                  count={goals.length}
                  expanded={isExpanded}
                  onToggle={() =>
                    setExpanded((current) => ({ ...current, [period]: !current[period] }))
                  }
                />

                {isExpanded ? (
                  <View
                    style={[
                      styles.sectionCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    {goals.map((goal, index) => (
                      <View key={goal.id}>
                        {index > 0 ? (
                          <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        ) : null}
                        <GoalRow goal={goal} progress={progressFor(goal)} />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}

          {seeding ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : null}

        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  center: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  section: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  cards: {
    gap: spacing.md,
  },
  sectionCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
