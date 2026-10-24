import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { AppText } from '@/components/app-text';
import { OptionSheet, type OptionSheetOption } from '@/components/option-sheet';
import { Screen } from '@/components/screen';
import { SettingsRow } from '@/components/settings-row';
import type { Settings, ThemePreference } from '@/db/settings';
import { deleteAllData, seedDemoData } from '@/db/seed';
import { useSettings } from '@/hooks/use-settings';
import { strings } from '@/i18n/strings';
import {
  cancelAllReminders,
  requestNotificationPermission,
  syncReminders,
} from '@/lib/reminders';
import { notifyDataChanged } from '@/store/db';
import { useSettingsStore } from '@/store/settings';
import { radius, spacing, useTheme } from '@/theme';

type WeekStartValue = '0' | '1';
type SettingsSheet = 'weekStart' | 'theme' | null;

const WEEK_START_OPTIONS: readonly OptionSheetOption<WeekStartValue>[] = [
  { value: '1', label: strings.settings.monday },
  { value: '0', label: strings.settings.sunday },
];

const THEME_OPTIONS: readonly OptionSheetOption<ThemePreference>[] = [
  { value: 'system', label: strings.settings.system },
  { value: 'light', label: strings.settings.light },
  { value: 'dark', label: strings.settings.dark },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const settings = useSettings();
  const updateSettings = useSettingsStore((state) => state.update);
  const [busy, setBusy] = useState(false);
  const [remindersBusy, setRemindersBusy] = useState(false);
  const [sheet, setSheet] = useState<SettingsSheet>(null);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      Alert.alert(
        strings.common.errorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setBusy(false);
    }
  }

  function saveSettings(patch: Partial<Settings>) {
    setSheet(null);
    void (async () => {
      try {
        await updateSettings(patch);
      } catch (error) {
        Alert.alert(
          strings.common.errorTitle,
          error instanceof Error ? error.message : String(error),
        );
      }
    })();
  }

  function handleSeed() {
    void run(async () => {
      const result = await seedDemoData(db);
      if (!result.created) {
        Alert.alert(strings.settings.loadDemo, strings.settings.seedNotEmpty);
        return;
      }
      notifyDataChanged();
      Alert.alert(strings.settings.seeded);
    });
  }

  function handleReset() {
    Alert.alert(strings.settings.resetConfirmTitle, strings.settings.resetConfirmBody, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.common.reset,
        style: 'destructive',
        onPress: () => {
          void run(async () => {
            await deleteAllData(db);
            await cancelAllReminders();
            notifyDataChanged();
            Alert.alert(strings.settings.resetDone);
          });
        },
      },
    ]);
  }

  async function handleNotificationsChange(enabled: boolean) {
    if (remindersBusy) {
      return;
    }
    setRemindersBusy(true);

    try {
      if (!enabled) {
        await updateSettings({ notificationsEnabled: false });
        await cancelAllReminders();
        return;
      }

      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(strings.reminders.permissionTitle, strings.reminders.permissionBody, [
          { text: strings.common.notNow, style: 'cancel' },
          {
            text: strings.common.openSettings,
            onPress: () => {
              void (async () => {
                // Remember the intent to enable; the foreground reconcile turns
                // this back off if permission is still missing.
                await updateSettings({ notificationsEnabled: true }).catch(() => undefined);
                await Linking.openSettings().catch(() => undefined);
              })();
            },
          },
        ]);
        return;
      }

      await updateSettings({ notificationsEnabled: true });
      await syncReminders(db, { ...settings, notificationsEnabled: true });
    } catch (error) {
      Alert.alert(
        strings.common.errorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setRemindersBusy(false);
    }
  }

  async function handleHapticsChange(enabled: boolean) {
    try {
      await updateSettings({ hapticsEnabled: enabled });
    } catch (error) {
      Alert.alert(
        strings.common.errorTitle,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  const weekStartValue: WeekStartValue = settings.weekStartsOn === 0 ? '0' : '1';
  const weekStartLabel =
    weekStartValue === '0' ? strings.settings.sunday : strings.settings.monday;
  const themeLabel =
    settings.theme === 'system'
      ? strings.settings.system
      : settings.theme === 'light'
        ? strings.settings.light
        : strings.settings.dark;

  return (
    <>
      <Screen>
        <View style={styles.header}>
          <AppText variant="display">{strings.settings.title}</AppText>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={strings.common.close}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.sections}>
          <Section title={strings.settings.preferencesSection}>
            <SettingsRow
              label={strings.settings.weekStartsOn}
              value={weekStartLabel}
              onPress={() => setSheet('weekStart')}
            />
            <Divider />
            <SettingsRow
              label={strings.settings.theme}
              value={themeLabel}
              onPress={() => setSheet('theme')}
            />
            <Divider />
            <SettingsRow
              label={strings.settings.notifications}
              hint={strings.settings.notificationsHint}
              right={
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(value) => void handleNotificationsChange(value)}
                  accessibilityLabel={strings.settings.notifications}
                  disabled={remindersBusy}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={theme.border}
                />
              }
            />
            <Divider />
            <SettingsRow
              label={strings.settings.haptics}
              hint={strings.settings.hapticsHint}
              right={
                <Switch
                  value={settings.hapticsEnabled}
                  onValueChange={(value) => void handleHapticsChange(value)}
                  accessibilityLabel={strings.settings.haptics}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={theme.border}
                />
              }
            />
          </Section>

          {__DEV__ ? (
            <Section title={strings.settings.dataSection}>
              <SettingsRow
                label={strings.settings.loadDemo}
                hint={strings.settings.loadDemoHint}
                onPress={busy ? undefined : handleSeed}
              />
              <Divider />
              <SettingsRow
                label={strings.settings.reset}
                hint={strings.settings.resetHint}
                danger
                onPress={busy ? undefined : handleReset}
              />
            </Section>
          ) : (
            <Section title={strings.settings.dataSection}>
              <SettingsRow
                label={strings.settings.reset}
                hint={strings.settings.resetHint}
                danger
                onPress={busy ? undefined : handleReset}
              />
            </Section>
          )}

          <Section title={strings.settings.aboutSection}>
            <SettingsRow label={strings.settings.version} value={version} />
            <Divider />
            <View style={styles.note}>
              <AppText variant="caption" color={theme.textMuted}>
                {strings.settings.offlineNote}
              </AppText>
            </View>
          </Section>
        </View>

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : null}
      </Screen>

      <OptionSheet
        visible={sheet === 'weekStart'}
        title={strings.settings.weekStartsOn}
        value={weekStartValue}
        options={WEEK_START_OPTIONS}
        onSelect={(value) => saveSettings({ weekStartsOn: value === '0' ? 0 : 1 })}
        onClose={() => setSheet(null)}
      />

      <OptionSheet
        visible={sheet === 'theme'}
        title={strings.settings.theme}
        value={settings.theme}
        options={THEME_OPTIONS}
        onSelect={(value) => saveSettings({ theme: value })}
        onClose={() => setSheet(null)}
      />
    </>
  );
}

function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <AppText variant="label" color={theme.textMuted}>
        {title}
      </AppText>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  sections: {
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  note: {
    paddingVertical: spacing.md,
  },
  busy: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
