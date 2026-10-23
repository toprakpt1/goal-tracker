import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { SettingsRow } from '@/components/settings-row';
import { deleteAllData, seedDemoData } from '@/db/seed';
import { strings } from '@/i18n/strings';
import { notifyDataChanged } from '@/store/db';
import { radius, spacing, useTheme } from '@/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const [busy, setBusy] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
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
            notifyDataChanged();
            Alert.alert(strings.settings.resetDone);
          });
        },
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="display">{strings.settings.title}</AppText>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
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
          <SettingsRow label={strings.settings.weekStartsOn} value={strings.settings.monday} />
          <Divider />
          <SettingsRow label={strings.settings.theme} value={strings.settings.system} />
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
