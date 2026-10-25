import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ColorPicker } from '@/components/color-picker';
import { EmptyState } from '@/components/empty-state';
import { IconPicker } from '@/components/icon-picker';
import { PageHeader } from '@/components/page-header';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { listGoalsForTracker } from '@/db/repositories/goals';
import { archiveTracker, getTracker, updateTracker } from '@/db/repositories/trackers';
import { isRecurringGoal } from '@/domain/scope';
import type { Goal, Tracker } from '@/domain/types';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/hooks/use-settings';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { parseAmount } from '@/lib/numbers';
import { syncReminders } from '@/lib/reminders';
import { notifyDataChanged } from '@/store/db';
import { radius, spacing, trackerPalette, useTheme } from '@/theme';

interface TrackerData {
  tracker: Tracker;
  goals: Goal[];
}

export default function EditTrackerScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const trackerId = params.id ?? '';

  const { data, loading } = useDbQuery<TrackerData | null>(
    async (database) => {
      const tracker = await getTracker(database, trackerId);
      if (!tracker) {
        return null;
      }
      const goals = await listGoalsForTracker(database, tracker.id);
      return { tracker, goals };
    },
    `tracker:${trackerId}`,
  );

  return (
    <Screen contentContainerStyle={styles.content}>
      <PageHeader title={strings.trackerForm.editTitle} onBack={() => router.back()} />

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : !data ? (
        <EmptyState
          icon="alert-circle-outline"
          title={strings.trackerForm.editTitle}
          body={strings.trackerForm.notFound}
        />
      ) : (
        <TrackerEditForm tracker={data.tracker} goals={data.goals} />
      )}
    </Screen>
  );
}

function TrackerEditForm({ tracker, goals }: TrackerData) {
  const theme = useTheme();
  const db = useSQLiteContext();
  const settings = useSettings();
  const [name, setName] = useState(tracker.name);
  const [unit, setUnit] = useState(tracker.unit);
  const [defaultStep, setDefaultStep] = useState(String(tracker.defaultStep));
  const [icon, setIcon] = useState(tracker.icon ?? 'target');
  const [color, setColor] = useState(tracker.color ?? trackerPalette[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isCheck = tracker.kind === 'check';
  // Scoped goals do not cover a period forever, so only recurring goals count.
  const allPeriodsCovered = new Set(
    goals.filter(isRecurringGoal).map((goal) => goal.period),
  ).size >= 4;

  async function handleSave() {
    const step = isCheck ? 1 : parseAmount(defaultStep);
    if (!name.trim()) {
      setError(strings.goalForm.trackerNameError);
      return;
    }
    if (!isCheck && !unit.trim()) {
      setError(strings.goalForm.trackerError);
      return;
    }
    if (!step) {
      setError(strings.goalForm.stepError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateTracker(db, tracker.id, {
        name,
        ...(isCheck ? {} : { unit, defaultStep: step }),
        icon,
        color,
      });
      notifyDataChanged();
      await syncReminders(db, settings).catch(() => undefined);
      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  }

  function confirmArchive() {
    Alert.alert(strings.trackerForm.archiveTitle, strings.trackerForm.archiveBody, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.common.archive,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await archiveTracker(db, tracker.id);
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

  return (
    <>
      {isCheck ? (
        <TextField
          label={strings.goalForm.name}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError(null);
          }}
          maxLength={40}
          hint={strings.trackerForm.checkHint}
        />
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.half}>
              <TextField
                label={strings.goalForm.name}
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setError(null);
                }}
                maxLength={40}
              />
            </View>
            <View style={styles.half}>
              <TextField
                label={strings.goalForm.unit}
                value={unit}
                onChangeText={(value) => {
                  setUnit(value);
                  setError(null);
                }}
                maxLength={16}
                hint={strings.goalForm.unitHint}
              />
            </View>
          </View>

          <TextField
            label={strings.goalForm.defaultStep}
            value={defaultStep}
            onChangeText={(value) => {
              setDefaultStep(value);
              setError(null);
            }}
            keyboardType="decimal-pad"
            inputMode="decimal"
            hint={strings.goalForm.defaultStepHint}
            suffix={unit.trim() || undefined}
          />
        </>
      )}

      <View style={styles.section}>
        <AppText variant="label" color={theme.textMuted}>
          {strings.goalForm.icon}
        </AppText>
        <IconPicker value={icon} color={color} onChange={setIcon} />
      </View>

      <View style={styles.section}>
        <AppText variant="label" color={theme.textMuted}>
          {strings.goalForm.color}
        </AppText>
        <ColorPicker value={color} onChange={setColor} />
      </View>

      {error ? (
        <AppText variant="caption" color={theme.danger}>
          {error}
        </AppText>
      ) : null}

      <PrimaryButton
        label={strings.common.save}
        onPress={() => void handleSave()}
        loading={saving}
      />

      <PrimaryButton
        label={strings.trackerForm.addGoal}
        variant="secondary"
        disabled={allPeriodsCovered}
        onPress={() =>
          router.push({ pathname: '/goal/new', params: { trackerId: tracker.id } })
        }
      />

      <Pressable
        onPress={confirmArchive}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.archive,
          {
            backgroundColor: withAlpha(theme.danger, 0.08),
            borderColor: withAlpha(theme.danger, 0.28),
          },
          pressed && styles.pressed,
        ]}
      >
        <AppText variant="bodyStrong" color={theme.danger}>
          {strings.trackerForm.archive}
        </AppText>
      </Pressable>
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  archive: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.65,
  },
});
