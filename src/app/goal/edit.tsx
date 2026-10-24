import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { TextField } from '@/components/text-field';
import { TrackerIcon } from '@/components/tracker-icon';
import { getGoalWithTracker, listGoalsForTracker, updateGoal } from '@/db/repositories/goals';
import { PERIODS, type Goal, type GoalWithTracker, type Period } from '@/domain/types';
import { useDbQuery } from '@/hooks/use-db-query';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { formatAmount } from '@/lib/format';
import { parseAmount } from '@/lib/numbers';
import { normalizeReminderTime } from '@/lib/reminder-time';
import { requestNotificationPermission, syncReminders } from '@/lib/reminders';
import { notifyDataChanged } from '@/store/db';
import { useSettingsStore } from '@/store/settings';
import { radius, spacing, useTheme } from '@/theme';

interface EditGoalData {
  goal: GoalWithTracker;
  goals: Goal[];
}

export default function EditGoalScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const goalId = params.id ?? '';

  const { data, loading } = useDbQuery<EditGoalData | null>(
    async (database) => {
      const goal = await getGoalWithTracker(database, goalId);
      if (!goal) {
        return null;
      }
      const goals = await listGoalsForTracker(database, goal.trackerId);
      return { goal, goals };
    },
    `edit-goal:${goalId}`,
  );

  return (
    <Screen contentContainerStyle={styles.content}>
      <PageHeader title={strings.goalForm.editTitle} onBack={() => router.back()} />

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : !data ? (
        <EmptyState
          icon="alert-circle-outline"
          title={strings.goals.notFound}
          body={strings.goalDetail.notFound}
        />
      ) : (
        <GoalEditForm goal={data.goal} goals={data.goals} />
      )}
    </Screen>
  );
}

function GoalEditForm({ goal, goals }: EditGoalData) {
  const theme = useTheme();
  const db = useSQLiteContext();
  const updateSettings = useSettingsStore((state) => state.update);
  const [period, setPeriod] = useState<Period>(goal.period);
  const [target, setTarget] = useState(String(goal.target));
  const [reminderTime, setReminderTime] = useState(goal.reminderTime ?? '');
  const [error, setError] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isCheck = goal.tracker.kind === 'check';
  const color = goal.tracker.color ?? theme.primary;
  const periodOptions = PERIODS.map((value) => ({
    value,
    label: strings.periods[value],
    disabled: goals.some((item) => item.period === value && item.id !== goal.id),
  }));

  async function handleSave() {
    const parsed = isCheck ? 1 : parseAmount(target);
    if (!parsed) {
      setError(strings.logSheet.invalidAmount);
      return;
    }

    const conflict = goals.find((item) => item.period === period && item.id !== goal.id);
    if (conflict) {
      setError(strings.goalForm.periodConflict);
      return;
    }

    const reminderInput = reminderTime.trim();
    const reminder = reminderInput ? normalizeReminderTime(reminderInput) : null;
    if (reminderInput && !reminder) {
      setReminderError(strings.goalForm.reminderError);
      return;
    }

    setSaving(true);
    setError(null);
    setReminderError(null);

    try {
      await updateGoal(db, goal.id, { period, target: parsed, reminderTime: reminder });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
      setSaving(false);
      return;
    }

    notifyDataChanged();

    try {
      const currentSettings = useSettingsStore.getState().settings;
      const reminderChanged = reminder !== (goal.reminderTime ?? null);

      if (reminder && reminderChanged && !currentSettings.notificationsEnabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          await syncReminders(db, currentSettings).catch(() => undefined);
          Alert.alert(
            strings.reminders.permissionTitle,
            strings.reminders.permissionSavedBody,
            [
              {
                text: strings.common.notNow,
                style: 'cancel',
                onPress: () => router.back(),
              },
              {
                text: strings.common.openSettings,
                onPress: () => {
                  void (async () => {
                    await updateSettings({ notificationsEnabled: true }).catch(() => undefined);
                    await Linking.openSettings().catch(() => undefined);
                    router.back();
                  })();
                },
              },
            ],
          );
          return;
        }

        await updateSettings({ notificationsEnabled: true });
        await syncReminders(db, { ...currentSettings, notificationsEnabled: true });
      } else {
        await syncReminders(db, currentSettings);
      }

      router.back();
    } catch (reminderError) {
      Alert.alert(
        strings.reminders.scheduleError,
        reminderError instanceof Error ? reminderError.message : String(reminderError),
        [{ text: strings.common.close, onPress: () => router.back() }],
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <View
        style={[
          styles.trackerCard,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}
      >
        <View style={[styles.iconChip, { backgroundColor: withAlpha(color, 0.14) }]}>
          <TrackerIcon icon={goal.tracker.icon} size={20} color={color} />
        </View>
        <View style={styles.trackerText}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {goal.tracker.name}
          </AppText>
          <AppText variant="caption" color={theme.textMuted}>
            {isCheck
              ? `${strings.periods[goal.period]} · ${strings.check.checklist}`
              : `${strings.periods[goal.period]} · ${formatAmount(goal.target)} ${
                  goal.tracker.unit
                }`}
          </AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="label" color={theme.textMuted}>
          {strings.goalForm.targetsLabel}
        </AppText>
        <SegmentedControl options={periodOptions} value={period} onChange={setPeriod} />
      </View>

      {isCheck ? (
        <AppText variant="caption" color={theme.textMuted}>
          {strings.check.editGoalHint}
        </AppText>
      ) : (
        <TextField
          label={strings.goalForm.targetLabel}
          value={target}
          onChangeText={(value) => {
            setTarget(value);
            setError(null);
          }}
          keyboardType="decimal-pad"
          inputMode="decimal"
          suffix={goal.tracker.unit}
          error={error}
          selectTextOnFocus
        />
      )}

      {isCheck && error ? (
        <AppText variant="caption" color={theme.danger}>
          {error}
        </AppText>
      ) : null}

      <TextField
        label={strings.goalForm.reminder}
        value={reminderTime}
        onChangeText={(value) => {
          setReminderTime(value);
          setReminderError(null);
        }}
        placeholder={strings.goalForm.reminderPlaceholder}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={5}
        hint={strings.goalForm.reminderHint}
        error={reminderError}
      />

      <PrimaryButton
        label={strings.common.save}
        onPress={() => void handleSave()}
        loading={saving}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  center: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  trackerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerText: {
    flex: 1,
    gap: 2,
  },
  section: {
    gap: spacing.sm,
  },
});
