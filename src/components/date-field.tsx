import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { strings } from '@/i18n/strings';
import { radius, spacing, useTheme } from '@/theme';

interface DateFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  hint?: string;
}

/**
 * A single-day picker. Android shows the native dialog, iOS expands an inline
 * calendar with a Done button so the field keeps a predictable height.
 */
export function DateField({ label, value, onChange, hint }: DateFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.field}>
      {label ? (
        <AppText variant="label" color={theme.textMuted}>
          {label}
        </AppText>
      ) : null}

      <Pressable
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={label ?? strings.goalForm.chooseDate}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.surfaceMuted, borderColor: open ? theme.primary : theme.border },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="calendar-outline" size={18} color={theme.textMuted} />
        <AppText variant="body" style={styles.value}>
          {format(value, 'EEE d MMM yyyy')}
        </AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.textMuted}
        />
      </Pressable>

      {open ? (
        <View
          style={[
            styles.pickerCard,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          ]}
        >
          <DateTimePicker
            value={value}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            themeVariant="dark"
            onChange={(event, date) => {
              if (Platform.OS !== 'ios') {
                setOpen(false);
              }
              if (event.type === 'set' && date) {
                onChange(date);
              }
            }}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.done,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <AppText variant="bodyStrong" color={theme.primary}>
                {strings.common.done}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {hint ? (
        <AppText variant="caption" color={theme.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  value: {
    flex: 1,
  },
  pickerCard: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingVertical: spacing.xs,
  },
  done: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.7,
  },
});
