import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

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
import { notifyDataChanged } from '@/store/db';
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
    <Screen>
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
  const [period, setPeriod] = useState<Period>(goal.period);
  const [target, setTarget] = useState(String(goal.target));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const color = goal.tracker.color ?? theme.primary;
  const periodOptions = PERIODS.map((value) => ({
    value,
    label: strings.periods[value],
    disabled: goals.some((item) => item.period === value && item.id !== goal.id),
  }));

  async function handleSave() {
    const parsed = parseAmount(target);
    if (!parsed) {
      setError(strings.logSheet.invalidAmount);
      return;
    }

    const conflict = goals.find((item) => item.period === period && item.id !== goal.id);
    if (conflict) {
      setError(strings.goalForm.periodConflict);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateGoal(db, goal.id, { period, target: parsed });
      notifyDataChanged();
      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <View
        style={[
          styles.trackerCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
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
            {strings.periods[goal.period]} · {formatAmount(goal.target)} {goal.tracker.unit}
          </AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="label" color={theme.textMuted}>
          {strings.goalForm.targetsLabel}
        </AppText>
        <SegmentedControl options={periodOptions} value={period} onChange={setPeriod} />
      </View>

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

      <PrimaryButton
        label={strings.common.save}
        onPress={() => void handleSave()}
        loading={saving}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
