import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CompletionCelebration } from '@/components/completion-celebration';
import { EmptyState } from '@/components/empty-state';
import { GoalCard } from '@/components/goal-card';
import { GoalRow } from '@/components/goal-row';
import { LogSheet } from '@/components/log-sheet';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { UndoToast } from '@/components/undo-toast';
import { loadDashboard } from '@/db/dashboard';
import { createLogWithCompletions, type LogSaveResult, type NewCompletion } from '@/db/logging';
import { deleteLog } from '@/db/repositories/logs';
import { getGoalProgress, type Progress } from '@/domain/progress';
import type { GoalWithTracker, Period } from '@/domain/types';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/hooks/use-settings';
import { useToday } from '@/hooks/use-today';
import { strings } from '@/i18n/strings';
import { formatAmount, formatDateHeading, greetingFor } from '@/lib/format';
import { notifyDataChanged } from '@/store/db';
import { radius, spacing, useTheme } from '@/theme';

const SECTION_PERIODS: Period[] = ['weekly', 'monthly', 'yearly'];
const UNDO_TIMEOUT_MS = 5000;

interface UndoState {
  logId: string;
  message: string;
}

export default function TodayScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const today = useToday();
  const settings = useSettings();
  const [expanded, setExpanded] = useState<Record<Period, boolean>>({
    daily: true,
    weekly: true,
    monthly: false,
    yearly: false,
  });
  const [logGoal, setLogGoal] = useState<GoalWithTracker | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [celebrations, setCelebrations] = useState<NewCompletion[]>([]);
  const [pendingUndo, setPendingUndo] = useState<UndoState | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickLock = useRef(false);

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

  useEffect(() => {
    return () => {
      if (undoTimer.current) {
        clearTimeout(undoTimer.current);
      }
    };
  }, []);

  function showUndo(logId: string, message: string) {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
    }
    setUndo({ logId, message });
    undoTimer.current = setTimeout(() => {
      setUndo(null);
      undoTimer.current = null;
    }, UNDO_TIMEOUT_MS);
  }

  function handleLogged(result: LogSaveResult, unit: string) {
    const message = strings.today.logged(formatAmount(result.log.amount), unit);

    if (settings.hapticsEnabled) {
      if (result.completions.length > 0) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    if (result.completions.length > 0) {
      setCelebrations(result.completions);
      setPendingUndo({ logId: result.log.id, message });
      return;
    }

    showUndo(result.log.id, message);
  }

  function handleCelebrationClose() {
    setCelebrations([]);
    if (pendingUndo) {
      showUndo(pendingUndo.logId, pendingUndo.message);
      setPendingUndo(null);
    }
  }

  async function handleQuickAdd(goal: GoalWithTracker) {
    if (quickLock.current) {
      return;
    }
    quickLock.current = true;

    try {
      const amount = goal.tracker.defaultStep;
      const result = await createLogWithCompletions(
        db,
        { trackerId: goal.trackerId, amount },
        today,
        settings.weekStartsOn,
      );
      notifyDataChanged();
      handleLogged(result, goal.tracker.unit);
    } catch (logError) {
      Alert.alert(
        strings.common.errorTitle,
        logError instanceof Error ? logError.message : String(logError),
      );
    } finally {
      quickLock.current = false;
    }
  }

  async function handleUndo() {
    if (!undo) {
      return;
    }

    const logId = undo.logId;
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
    setUndo(null);

    try {
      await deleteLog(db, logId);
      notifyDataChanged();
    } catch (undoError) {
      Alert.alert(
        strings.common.errorTitle,
        undoError instanceof Error ? undoError.message : String(undoError),
      );
    }
  }

  const hasGoals = (data?.goals.length ?? 0) > 0;
  const dailyGoals = goalsByPeriod.daily;
  const logProgress = logGoal ? progressFor(logGoal) : null;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
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
            actionLabel={strings.today.emptyAction}
            onAction={() => router.push('/goal/new')}
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
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      progress={progressFor(goal)}
                      onPress={() => setLogGoal(goal)}
                      onQuickAdd={() => void handleQuickAdd(goal)}
                    />
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
                          <GoalRow
                            goal={goal}
                            progress={progressFor(goal)}
                            onPress={() => setLogGoal(goal)}
                          />
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        )}
      </Screen>

      {logGoal ? (
        <LogSheet
          key={logGoal.id}
          tracker={logGoal.tracker}
          weekStartsOn={settings.weekStartsOn}
          subtitle={strings.periods[logGoal.period]}
          total={logProgress?.total}
          target={logProgress?.target}
          onClose={() => setLogGoal(null)}
          onSaved={(result) => {
            handleLogged(result, logGoal.tracker.unit);
          }}
        />
      ) : null}

      <CompletionCelebration
        completions={celebrations}
        onClose={handleCelebrationClose}
      />

      <UndoToast
        visible={undo !== null}
        message={undo?.message ?? ''}
        onUndo={() => void handleUndo()}
        style={styles.toast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
  toast: {
    bottom: 84,
  },
});
