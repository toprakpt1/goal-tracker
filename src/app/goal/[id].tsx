import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { LogSheet } from '@/components/log-sheet';
import { PageHeader } from '@/components/page-header';
import { PrimaryButton } from '@/components/primary-button';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { TrackerIcon } from '@/components/tracker-icon';
import { UndoToast } from '@/components/undo-toast';
import { loadGoalDetail } from '@/db/goal-detail';
import { archiveGoal } from '@/db/repositories/goals';
import { deleteLog } from '@/db/repositories/logs';
import { getProgress } from '@/domain/progress';
import type { LogEntry } from '@/domain/types';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/hooks/use-settings';
import { useToday } from '@/hooks/use-today';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { formatAmount } from '@/lib/format';
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
  const [undo, setUndo] = useState<UndoState | null>(null);
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
  const color = goal?.tracker.color ?? theme.primary;

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
      strings.goalDetail.deleteLogTitle,
      strings.goalDetail.deleteLogBody(formatAmount(log.amount), goal.tracker.unit),
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
                    {strings.goalDetail.progress}
                  </AppText>
                  <View style={styles.amountRow}>
                    <AppText style={styles.amount}>{formatAmount(progress.total)}</AppText>
                    <AppText variant="body" color={theme.textMuted}>
                      / {formatAmount(progress.target)} {goal.tracker.unit}
                    </AppText>
                  </View>
                </View>
                {progress.isComplete ? (
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

              <ProgressBar ratio={progress.ratio} color={color} height={10} />

              <View style={styles.summaryFooter}>
                <AppText variant="caption" color={theme.textMuted}>
                  {strings.periods[goal.period]} · {goal.tracker.unit}
                </AppText>
                <AppText
                  variant="caption"
                  color={progress.isComplete ? theme.success : theme.textMuted}
                >
                  {progress.isComplete
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
            </View>

            <PrimaryButton
              label={strings.goalDetail.logNow}
              onPress={() => setSheetVisible(true)}
            />

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText variant="heading">{strings.goalDetail.recentLogs}</AppText>
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
                            {formatAmount(log.amount)} {goal.tracker.unit}
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

      {sheetVisible && goal ? (
        <LogSheet
          key={goal.id}
          tracker={goal.tracker}
          subtitle={strings.periods[goal.period]}
          total={progress?.total}
          target={progress?.target}
          onClose={() => setSheetVisible(false)}
          onSaved={(log) => {
            showUndo(
              log.id,
              strings.today.logged(formatAmount(log.amount), goal.tracker.unit),
            );
          }}
        />
      ) : null}

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
