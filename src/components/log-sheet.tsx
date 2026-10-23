import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';

import { AppText } from '@/components/app-text';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { TrackerIcon } from '@/components/tracker-icon';
import { createLog } from '@/db/repositories/logs';
import type { LogEntry, Tracker } from '@/domain/types';
import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { formatAmount } from '@/lib/format';
import { parseAmount } from '@/lib/numbers';
import { notifyDataChanged } from '@/store/db';
import { radius, spacing, useTheme } from '@/theme';

interface LogSheetProps {
  tracker: Tracker;
  subtitle?: string;
  total?: number;
  target?: number;
  onClose: () => void;
  onSaved: (log: LogEntry) => void;
}

export function LogSheet({
  tracker,
  subtitle,
  total,
  target,
  onClose,
  onSaved,
}: LogSheetProps) {
  const theme = useTheme();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(() => String(tracker.defaultStep));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const defaultStep = tracker.defaultStep;
  const color = tracker.color ?? theme.primary;
  const quickValues = Array.from(new Set([defaultStep, 1, 5, 10]));

  async function handleSave() {
    const parsed = parseAmount(amount);
    if (!parsed) {
      setError(strings.logSheet.invalidAmount);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const log = await createLog(db, {
        trackerId: tracker.id,
        amount: parsed,
        note,
      });
      notifyDataChanged();
      onSaved(log);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={strings.common.close}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.avoider}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.background,
                paddingBottom: insets.bottom + spacing.lg,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.border }]} />

            <View style={styles.header}>
              <View style={[styles.iconChip, { backgroundColor: withAlpha(color, 0.14) }]}>
                <TrackerIcon icon={tracker.icon} size={22} color={color} />
              </View>
              <View style={styles.headerText}>
                <AppText variant="heading" numberOfLines={1}>
                  {tracker.name}
                </AppText>
                <AppText variant="caption" color={theme.textMuted} numberOfLines={1}>
                  {subtitle ??
                    `${strings.logSheet.title} · ${tracker.unit}`}
                </AppText>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={strings.common.close}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.close,
                  { backgroundColor: theme.surfaceMuted },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="close" size={18} color={theme.textMuted} />
              </Pressable>
            </View>

            {typeof total === 'number' && typeof target === 'number' ? (
              <AppText variant="caption" color={theme.textMuted}>
                {strings.today.progress(
                  formatAmount(total),
                  formatAmount(target),
                  tracker.unit,
                )}
              </AppText>
            ) : null}

            <TextField
              label={strings.logSheet.amount}
              value={amount}
              onChangeText={(value) => {
                setAmount(value);
                setError(null);
              }}
              keyboardType="decimal-pad"
              inputMode="decimal"
              suffix={tracker.unit}
              error={error}
              selectTextOnFocus
            />

            <View style={styles.quickRow}>
              {quickValues.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => {
                    setAmount(String(value));
                    setError(null);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.quickChip,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText variant="bodyStrong" color={theme.textMuted}>
                    {formatAmount(value)}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <TextField
              label={strings.logSheet.note}
              value={note}
              onChangeText={setNote}
              placeholder={strings.logSheet.notePlaceholder}
              maxLength={140}
            />

            <PrimaryButton
              label={strings.logSheet.log(formatAmount(parseAmount(amount) ?? 0), tracker.unit)}
              onPress={() => void handleSave()}
              loading={saving}
              disabled={!parseAmount(amount)}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  avoider: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -spacing.xs,
  },
  quickChip: {
    minWidth: 54,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
