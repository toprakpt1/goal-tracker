import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/app-text';
import { CheckToggle } from '@/components/check-toggle';
import { ColorPicker } from '@/components/color-picker';
import { IconPicker } from '@/components/icon-picker';
import { PageHeader } from '@/components/page-header';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { TextField } from '@/components/text-field';
import { TrackerIcon } from '@/components/tracker-icon';
import { createGoal, listGoals } from '@/db/repositories/goals';
import { createTracker, listTrackers } from '@/db/repositories/trackers';
import {
  PERIODS,
  type Goal,
  type Period,
  type Tracker,
  type TrackerKind,
} from '@/domain/types';
import { useDbQuery } from '@/hooks/use-db-query';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { formatAmount } from '@/lib/format';
import { parseAmount } from '@/lib/numbers';
import { normalizeReminderTime } from '@/lib/reminder-time';
import { requestNotificationPermission, syncReminders } from '@/lib/reminders';
import { notifyDataChanged } from '@/store/db';
import { useSettingsStore } from '@/store/settings';
import { radius, spacing, trackerPalette, useTheme } from '@/theme';

const NEW_TRACKER_ID = '__new__';
const EMPTY_TARGETS: Record<Period, string> = {
  daily: '',
  weekly: '',
  monthly: '',
  yearly: '',
};
const DEFAULT_CHECK_PERIODS: Period[] = ['daily'];
const TRACKER_KIND_OPTIONS = [
  { value: 'numeric', label: strings.goalForm.kindNumeric },
  { value: 'check', label: strings.goalForm.kindCheck },
] as const;

export default function NewGoalScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ trackerId?: string }>();
  const updateSettings = useSettingsStore((state) => state.update);

  const { data, loading } = useDbQuery(
    async (database) => {
      const [trackers, goals] = await Promise.all([
        listTrackers(database),
        listGoals(database),
      ]);
      return { trackers, goals };
    },
    'new-goal',
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targets, setTargets] = useState<Record<Period, string>>(EMPTY_TARGETS);
  const [kind, setKind] = useState<TrackerKind>('numeric');
  const [checkPeriods, setCheckPeriods] = useState<Period[]>(DEFAULT_CHECK_PERIODS);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [icon, setIcon] = useState('target');
  const [color, setColor] = useState<string>(trackerPalette[0]);
  const [defaultStep, setDefaultStep] = useState('1');
  const [reminderTime, setReminderTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The selection starts from the requested tracker (or the first one) without
  // an effect: an explicit tap simply overrides the derived default.
  const defaultSelectedId = useMemo(() => {
    if (!data) {
      return null;
    }
    const requested = params.trackerId;
    if (requested && data.trackers.some((tracker) => tracker.id === requested)) {
      return requested;
    }
    return data.trackers[0]?.id ?? NEW_TRACKER_ID;
  }, [data, params.trackerId]);

  const currentId = selectedId ?? defaultSelectedId;

  function chooseTracker(id: string) {
    setSelectedId(id);
    setTargets(EMPTY_TARGETS);
    setCheckPeriods(id === NEW_TRACKER_ID ? DEFAULT_CHECK_PERIODS : []);
    setError(null);
  }

  function chooseKind(next: TrackerKind) {
    setKind(next);
    if (next === 'check' && checkPeriods.length === 0) {
      setCheckPeriods(DEFAULT_CHECK_PERIODS);
    }
    setError(null);
  }

  function toggleCheckPeriod(period: Period) {
    setCheckPeriods((current) =>
      current.includes(period)
        ? current.filter((value) => value !== period)
        : [...current, period],
    );
    setError(null);
  }

  const selectedTracker: Tracker | null = useMemo(() => {
    if (!data || currentId === null || currentId === NEW_TRACKER_ID) {
      return null;
    }
    return data.trackers.find((tracker) => tracker.id === currentId) ?? null;
  }, [data, currentId]);

  const existingGoals = useMemo(() => {
    const result: Partial<Record<Period, Goal>> = {};
    if (!data || currentId === null || currentId === NEW_TRACKER_ID) {
      return result;
    }
    for (const goal of data.goals) {
      if (goal.trackerId === currentId) {
        result[goal.period] = goal;
      }
    }
    return result;
  }, [data, currentId]);

  const creatingTracker = currentId === NEW_TRACKER_ID;
  const activeKind: TrackerKind = creatingTracker
    ? kind
    : (selectedTracker?.kind ?? 'numeric');
  const effectiveUnit = creatingTracker ? unit.trim() : selectedTracker?.unit ?? '';

  async function handleSave() {
    if (!data || currentId === null) {
      return;
    }

    setError(null);

    const entries = PERIODS.flatMap((period) => {
      if (existingGoals[period]) {
        return [];
      }
      if (activeKind === 'check') {
        return checkPeriods.includes(period) ? [{ period, target: 1 }] : [];
      }
      const target = parseAmount(targets[period]);
      return target === null ? [] : [{ period, target }];
    });

    if (entries.length === 0) {
      setError(
        activeKind === 'check'
          ? strings.goalForm.checkPeriodError
          : strings.goalForm.targetError,
      );
      return;
    }

    const reminderInput = reminderTime.trim();
    const reminder = reminderInput ? normalizeReminderTime(reminderInput) : null;
    if (reminderInput && !reminder) {
      setError(strings.goalForm.reminderError);
      return;
    }

    let trackerId = currentId;
    let newTracker:
      | { name: string; kind: TrackerKind; unit: string; step: number }
      | null = null;

    if (creatingTracker) {
      const trimmedName = name.trim();
      const trimmedUnit = unit.trim();

      if (!trimmedName) {
        setError(
          activeKind === 'check'
            ? strings.goalForm.trackerNameError
            : strings.goalForm.trackerError,
        );
        return;
      }
      if (activeKind === 'numeric' && !trimmedUnit) {
        setError(strings.goalForm.trackerError);
        return;
      }

      const step = activeKind === 'check' ? 1 : parseAmount(defaultStep);
      if (!step) {
        setError(strings.goalForm.stepError);
        return;
      }

      newTracker = {
        name: trimmedName,
        kind: activeKind,
        unit: activeKind === 'check' ? '' : trimmedUnit,
        step,
      };
    }

    setSaving(true);
    try {
      await db.withTransactionAsync(async () => {
        if (newTracker) {
          const created = await createTracker(db, {
            name: newTracker.name,
            kind: newTracker.kind,
            unit: newTracker.unit,
            icon,
            color,
            defaultStep: newTracker.step,
            sortOrder: data.trackers.length,
          });
          trackerId = created.id;
        }

        const existingCount = data.goals.filter((goal) => goal.trackerId === trackerId).length;

        for (const [index, entry] of entries.entries()) {
          await createGoal(db, {
            trackerId,
            period: entry.period,
            target: entry.target,
            reminderTime: reminder,
            sortOrder: existingCount + index,
          });
        }
      });

      notifyDataChanged();

      if (reminder) {
        try {
          const granted = await requestNotificationPermission();
          if (!granted) {
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

          const currentSettings = useSettingsStore.getState().settings;
          if (!currentSettings.notificationsEnabled) {
            await updateSettings({ notificationsEnabled: true });
          }
          await syncReminders(db, { ...currentSettings, notificationsEnabled: true });
        } catch (reminderError) {
          Alert.alert(
            strings.reminders.scheduleError,
            reminderError instanceof Error ? reminderError.message : String(reminderError),
            [{ text: strings.common.close, onPress: () => router.back() }],
          );
          return;
        }
      }

      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <PageHeader title={strings.goalForm.newTitle} onBack={() => router.back()} />

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <AppText variant="label" color={theme.textMuted}>
              {strings.goalForm.trackerLabel}
            </AppText>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trackerRow}
            >
              <Pressable
                onPress={() => chooseTracker(NEW_TRACKER_ID)}
                accessibilityRole="button"
                accessibilityState={{ selected: creatingTracker }}
                style={({ pressed }) => [
                  styles.trackerOption,
                  {
                    backgroundColor: creatingTracker
                      ? withAlpha(theme.primary, 0.14)
                      : theme.surface,
                    borderColor: creatingTracker ? theme.primary : theme.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="add"
                  size={22}
                  color={creatingTracker ? theme.primary : theme.textMuted}
                />
                <AppText variant="caption" numberOfLines={1}>
                  {strings.goalForm.newTracker}
                </AppText>
              </Pressable>

              {(data?.trackers ?? []).map((tracker) => {
                const trackerColor = tracker.color ?? theme.primary;
                const selected = tracker.id === currentId;
                return (
                  <Pressable
                    key={tracker.id}
                    onPress={() => chooseTracker(tracker.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.trackerOption,
                      {
                        backgroundColor: selected
                          ? withAlpha(trackerColor, 0.14)
                          : theme.surface,
                        borderColor: selected ? trackerColor : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <TrackerIcon
                      icon={tracker.icon}
                      size={22}
                      color={selected ? trackerColor : theme.textMuted}
                    />
                    <AppText variant="caption" numberOfLines={1}>
                      {tracker.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {creatingTracker ? (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}
            >
              <View style={styles.pickerBlock}>
                <AppText variant="label" color={theme.textMuted}>
                  {strings.goalForm.trackerKind}
                </AppText>
                <SegmentedControl
                  options={TRACKER_KIND_OPTIONS}
                  value={kind}
                  onChange={chooseKind}
                />
                <AppText variant="caption" color={theme.textMuted}>
                  {kind === 'check'
                    ? strings.goalForm.kindCheckHint
                    : strings.goalForm.kindNumericHint}
                </AppText>
              </View>

              {kind === 'check' ? (
                <TextField
                  label={strings.goalForm.name}
                  value={name}
                  onChangeText={setName}
                  placeholder={strings.goalForm.namePlaceholder}
                  maxLength={40}
                />
              ) : (
                <View style={styles.row}>
                  <View style={styles.half}>
                    <TextField
                      label={strings.goalForm.name}
                      value={name}
                      onChangeText={setName}
                      placeholder={strings.goalForm.namePlaceholder}
                      maxLength={40}
                    />
                  </View>
                  <View style={styles.half}>
                    <TextField
                      label={strings.goalForm.unit}
                      value={unit}
                      onChangeText={setUnit}
                      placeholder={strings.goalForm.unitPlaceholder}
                      maxLength={16}
                      hint={strings.goalForm.unitHint}
                    />
                  </View>
                </View>
              )}

              {kind === 'numeric' ? (
                <TextField
                  label={strings.goalForm.defaultStep}
                  value={defaultStep}
                  onChangeText={setDefaultStep}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  hint={strings.goalForm.defaultStepHint}
                  suffix={unit.trim() || undefined}
                />
              ) : null}

              <View style={styles.pickerBlock}>
                <AppText variant="label" color={theme.textMuted}>
                  {strings.goalForm.icon}
                </AppText>
                <IconPicker value={icon} color={color} onChange={setIcon} />
              </View>

              <View style={styles.pickerBlock}>
                <AppText variant="label" color={theme.textMuted}>
                  {strings.goalForm.color}
                </AppText>
                <ColorPicker value={color} onChange={setColor} />
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.targetsHeader}>
              <AppText variant="label" color={theme.textMuted}>
                {activeKind === 'check'
                  ? strings.goalForm.checkPeriodsLabel
                  : strings.goalForm.targetsLabel}
              </AppText>
              <AppText variant="caption" color={theme.textMuted} style={styles.targetsHint}>
                {activeKind === 'check'
                  ? strings.goalForm.checkPeriodsHint
                  : strings.goalForm.targetsHint}
              </AppText>
            </View>

            <View
              style={[
                styles.targetsCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              {PERIODS.map((period, index) => {
                const existing = existingGoals[period];
                const checkSelected = checkPeriods.includes(period);
                return (
                  <View key={period}>
                    {index > 0 ? (
                      <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    ) : null}
                    <View style={styles.targetRow}>
                      <View style={styles.targetLabel}>
                        <AppText variant="bodyStrong">{strings.periods[period]}</AppText>
                        <AppText variant="caption" color={theme.textMuted}>
                          {existing
                            ? activeKind === 'check'
                              ? `${strings.check.checklist} · ${strings.goalForm.alreadyTracked}`
                              : `${formatAmount(existing.target)} ${effectiveUnit} · ${
                                  strings.goalForm.alreadyTracked
                                }`
                            : activeKind === 'check'
                              ? strings.goalForm.checkGoalLabel
                              : effectiveUnit}
                        </AppText>
                      </View>

                      {existing ? (
                        <Ionicons name="checkmark-circle" size={22} color={theme.success} />
                      ) : activeKind === 'check' ? (
                        <CheckToggle
                          checked={checkSelected}
                          onPress={() => toggleCheckPeriod(period)}
                          label={`${strings.periods[period]} ${strings.goalForm.checkGoalLabel}`}
                        />
                      ) : (
                        <View style={styles.targetInput}>
                          <TextField
                            value={targets[period]}
                            onChangeText={(value) => {
                              setTargets((current) => ({ ...current, [period]: value }));
                              setError(null);
                            }}
                            placeholder={strings.goalForm.targetPlaceholder}
                            keyboardType="decimal-pad"
                            inputMode="decimal"
                            suffix={effectiveUnit || undefined}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <TextField
              label={strings.goalForm.reminder}
              value={reminderTime}
              onChangeText={(value) => {
                setReminderTime(value);
                setError(null);
              }}
              placeholder={strings.goalForm.reminderPlaceholder}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={5}
              hint={strings.goalForm.reminderHint}
            />
          </View>

          {error ? (
            <AppText variant="caption" color={theme.danger}>
              {error}
            </AppText>
          ) : null}

          <PrimaryButton
            label={strings.goalForm.saveLabel}
            onPress={() => void handleSave()}
            loading={saving}
            disabled={currentId === null}
          />
        </>
      )}
    </Screen>
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
  section: {
    gap: spacing.sm,
  },
  trackerRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  trackerOption: {
    width: 100,
    minHeight: 84,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  pickerBlock: {
    gap: spacing.sm,
  },
  targetsHeader: {
    gap: 2,
  },
  targetsHint: {
    marginBottom: spacing.xs,
  },
  targetsCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  targetLabel: {
    flex: 1,
    gap: 2,
  },
  targetInput: {
    width: 132,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
