import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CompletionCelebration } from '@/components/completion-celebration';
import { EmptyState } from '@/components/empty-state';
import { LogSheet } from '@/components/log-sheet';
import { PageHeader } from '@/components/page-header';
import { PrimaryButton } from '@/components/primary-button';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { TrackerIcon } from '@/components/tracker-icon';
import { UndoToast } from '@/components/undo-toast';
import { loadGoalDetail } from '@/db/goal-detail';
import {
  toggleCheckGoal,
  type LogSaveResult,
  type NewCompletion,
} from '@/db/logging';
import { archiveGoal } from '@/db/repositories/goals';
import { deleteLog } from '@/db/repositories/logs';
import { getProgress } from '@/domain/progress';
import { getStreakSummary } from '@/domain/streak';
import type { LogEntry } from '@/domain/types';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/hooks/use-settings';
import { useToday } from '@/hooks/use-today';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { formatAmount } from '@/lib/format';
import { syncReminders } from '@/lib/reminders';
import { notifyDataChanged } from '@/store/db';
import { radius, spacing, useTheme } from '@/theme';

const UNDO_TIMEOUT_MS = 5000;

interface UndoState {
  logId: string;
  message: string;
}

export default function GoalDetailScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const today = useToday();
  const settings = useSettings();
  const params = useLocalSearchParams<{ id?: string }>();
  const goalId = params.id ?? '';

  const [sheetVisible, setSheetVisible] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [celebrations, setCelebrations] = useState<NewCompletion[]>([]);
  const [pendingUndo, setPendingUndo] = useState<UndoState | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateKey = format(today, 'yyyy-MM-dd');
  const { data, loading, reload } = useDbQuery(
    (database) => loadGoalDetail(database, goalId, today, settings.weekStartsOn),
    `${goalId}:${dateKey}:${settings.weekStartsOn}`,
  );

  useEffect(() => {
    return () => {
      if (undoTimer.current) {
        clearTimeout(undoTimer.current);
      }
    };
  }, []);

  const detail = data ?? null;
  const goal = detail?.goal ?? null;
  const progress = detail ? getProgress(goal?.target ?? 0, detail.periodLogs, detail.range) : null;
  const streak =
    detail && goal
      ? getStreakSummary(
          goal.period,
          goal.target,
          detail.streakLogs,
          today,
          settings.weekStartsOn,
        )
      : null;
  const color = goal?.tracker.color ?? theme.primary;
  const streakUnit = goal ? strings.streak.units[goal.period] : '';
  const isCheck = goal?.tracker.kind === 'check';

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

  function handleLogged(result: LogSaveResult) {
    if (!goal) {
      return;
    }

    const message =
      goal.tracker.kind === 'check'
        ? strings.check.markedDone
        : strings.today.logged(formatAmount(result.log.amount), goal.tracker.unit);

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

  async function handleToggleCheck() {
    if (!goal || toggling) {
      return;
    }

    setToggling(true);
    try {
      const outcome = await toggleCheckGoal(db, goal, today, settings.weekStartsOn);
      notifyDataChanged();

      if (outcome.action === 'checked' && outcome.result) {
        handleLogged(outcome.result);
      } else if (settings.hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (checkError) {
      Alert.alert(
        strings.common.errorTitle,
        checkError instanceof Error ? checkError.message : String(checkError),
      );
    } finally {
      setToggling(false);
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

  function confirmDeleteLog(log: LogEntry) {
    if (!goal) {
      return;
    }

    Alert.alert(
      isCheck ? strings.check.deleteCheckTitle : strings.goalDetail.deleteLogTitle,
      isCheck
        ? strings.check.deleteCheckBody
        : strings.goalDetail.deleteLogBody(
            formatAmount(log.amount),
            goal.tracker.unit,
          ),
      [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: strings.common.delete,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteLog(db, log.id);
                notifyDataChanged();
                reload();
              } catch (deleteError) {
                Alert.alert(
                  strings.common.errorTitle,
                  deleteError instanceof Error ? deleteError.message : String(deleteError),
                );
              }
            })();
          },
        },
      ],
    );
  }

  function confirmArchive() {
    if (!goal) {
      return;
    }

    Alert.alert(strings.goalDetail.archiveTitle, strings.goalDetail.archiveBody, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.common.archive,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await archiveGoal(db, goal.id);
              notifyDataChanged();
              await syncReminders(db, settings).catch(() => undefined);
              router.back();
            } catch (archiveError) {
              Alert.alert(
                strings.common.errorTitle,
                archiveError instanceof Error ? archiveError.message : String(archiveError),
              );
            }
          })();
        },
      },
    ]);
  }

  const editButton = (
    <Pressable
      onPress={() => router.push({ pathname: '/goal/edit', params: { id: goalId } })}
      accessibilityRole="button"
      accessibilityLabel={strings.goalDetail.edit}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="create-outline" size={19} color={theme.text} />
    </Pressable>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Screen>
        <PageHeader
          title={goal?.tracker.name ?? strings.goalDetail.progress}
          subtitle={goal ? strings.periods[goal.period] : undefined}
          onBack={() => router.back()}
          right={goal ? editButton : undefined}
        />

        {loading && !data ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : !detail || !goal || !progress ? (
          <EmptyState
            icon="alert-circle-outline"
            title={strings.goals.notFound}
            body={strings.goalDetail.notFound}
          />
        ) : (
          <>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.summaryHeader}>
                <View style={[styles.iconChip, { backgroundColor: withAlpha(color, 0.14) }]}>
                  <TrackerIcon icon={goal.tracker.icon} size={22} color={color} />
                </View>
                <View style={styles.summaryText}>
                  <AppText variant="caption" color={theme.textMuted}>
                    {isCheck ? strings.check.status : strings.goalDetail.progress}
                  </AppText>
                  {isCheck ? (
                    <AppText style={styles.checkStatus}>
                      {progress.isComplete ? strings.check.done : strings.check.notDone}
                    </AppText>
                  ) : (
                    <View style={styles.amountRow}>
                      <AppText style={styles.amount}>{formatAmount(progress.total)}</AppText>
                      <AppText variant="body" color={theme.textMuted}>
                        / {formatAmount(progress.target)} {goal.tracker.unit}
                      </AppText>
                    </View>
                  )}
                </View>
                {isCheck ? null : progress.isComplete ? (
                  <View style={[styles.doneBadge, { backgroundColor: withAlpha(theme.success, 0.14) }]}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.success} />
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

              <ProgressBar
                ratio={progress.ratio}
                color={progress.isComplete ? theme.success : color}
                height={10}
              />

              <View style={styles.summaryFooter}>
                <AppText variant="caption" color={theme.textMuted}>
                  {strings.periods[goal.period]} ·{' '}
                  {isCheck ? strings.check.checklist : goal.tracker.unit}
                </AppText>
                <AppText
                  variant="caption"
                  color={progress.isComplete ? theme.success : theme.textMuted}
                >
                  {isCheck
                    ? progress.isComplete
                      ? strings.check.footerDone
                      : strings.check.footerPending
                    : progress.isComplete
                      ? progress.overshoot > 0
                        ? strings.today.overshoot(
                            formatAmount(progress.overshoot),
                            goal.tracker.unit,
                          )
                        : strings.today.done
                      : strings.today.remaining(
                          formatAmount(progress.remaining),
                          goal.tracker.unit,
                        )}
                </AppText>
              </View>

              {goal.reminderTime ? (
                <View style={styles.reminderRow}>
                  <Ionicons name="notifications-outline" size={14} color={theme.textMuted} />
                  <AppText variant="caption" color={theme.textMuted}>
                    {settings.notificationsEnabled
                      ? strings.goalDetail.reminder(goal.reminderTime)
                      : strings.goalDetail.reminderOff(goal.reminderTime)}
                  </AppText>
                </View>
              ) : null}
            </View>

            {isCheck ? (
              <PrimaryButton
                label={
                  progress.isComplete ? strings.check.markUndone : strings.check.markDone
                }
                variant={progress.isComplete ? 'secondary' : 'primary'}
                icon={
                  <Ionicons
                    name={progress.isComplete ? 'arrow-undo-outline' : 'checkmark-circle-outline'}
                    size={18}
                    color={progress.isComplete ? theme.text : theme.onPrimary}
                  />
                }
                onPress={() => void handleToggleCheck()}
                loading={toggling}
              />
            ) : (
              <PrimaryButton
                label={strings.goalDetail.logNow}
                onPress={() => setSheetVisible(true)}
              />
            )}

            {streak ? (
              <View
                style={[
                  styles.streakCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.streakHalf}>
                  <View
                    style={[styles.streakIcon, { backgroundColor: withAlpha(theme.warning, 0.14) }]}
                  >
                    <Ionicons name="flame" size={19} color={theme.warning} />
                  </View>
                  <View style={styles.streakText}>
                    <AppText variant="caption" color={theme.textMuted}>
                      {strings.streak.current}
                    </AppText>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {streak.current > 0
                        ? strings.streak.value(streak.current, streakUnit)
                        : strings.streak.none}
                    </AppText>
                  </View>
                </View>

                <View style={[styles.streakDivider, { backgroundColor: theme.border }]} />

                <View style={styles.streakHalf}>
                  <View
                    style={[styles.streakIcon, { backgroundColor: withAlpha(theme.primary, 0.14) }]}
                  >
                    <Ionicons name="trophy-outline" size={19} color={theme.primary} />
                  </View>
                  <View style={styles.streakText}>
                    <AppText variant="caption" color={theme.textMuted}>
                      {strings.streak.best}
                    </AppText>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {strings.streak.value(streak.best, streakUnit)}
                    </AppText>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText variant="heading">
                  {isCheck ? strings.check.recentChecks : strings.goalDetail.recentLogs}
                </AppText>
                <AppText variant="caption" color={theme.textMuted}>
                  {strings.goalDetail.sharedNote}
                </AppText>
              </View>

              {detail.recentLogs.length === 0 ? (
                <View
                  style={[
                    styles.emptyLogs,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <AppText variant="body" color={theme.textMuted}>
                    {strings.goalDetail.noLogs}
                  </AppText>
                </View>
              ) : (
                <View
                  style={[
                    styles.logsCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  {detail.recentLogs.map((log, index) => (
                    <View key={log.id}>
                      {index > 0 ? (
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                      ) : null}
                      <View style={styles.logRow}>
                        <View style={styles.logText}>
                          <AppText variant="bodyStrong">
                            {isCheck
                              ? strings.check.checked
                              : `${formatAmount(log.amount)} ${goal.tracker.unit}`}
                          </AppText>
                          <AppText variant="caption" color={theme.textMuted}>
                            {format(new Date(log.loggedAt), 'MMM d · HH:mm')}
                            {log.note ? ` · ${log.note}` : ''}
                          </AppText>
                        </View>
                        <Pressable
                          onPress={() => confirmDeleteLog(log)}
                          accessibilityRole="button"
                          accessibilityLabel={strings.common.delete}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.deleteButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              onPress={confirmArchive}
              accessibilityRole="button"
              style={({ pressed }) => [styles.archive, pressed && styles.pressed]}
            >
              <AppText variant="bodyStrong" color={theme.danger}>
                {strings.goalDetail.archive}
              </AppText>
            </Pressable>
          </>
        )}
      </Screen>

      {sheetVisible && goal && !isCheck ? (
        <LogSheet
          key={goal.id}
          tracker={goal.tracker}
          weekStartsOn={settings.weekStartsOn}
          subtitle={strings.periods[goal.period]}
          total={progress?.total}
          target={progress?.target}
          onClose={() => setSheetVisible(false)}
          onSaved={handleLogged}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
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
    opacity: 0.65,
  },
  summaryCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  amount: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  checkStatus: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.4,
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
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: -spacing.xs,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  streakHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    flex: 1,
    gap: 1,
  },
  streakDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    gap: 2,
  },
  emptyLogs: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  logsCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  logText: {
    flex: 1,
    gap: 2,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  archive: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
