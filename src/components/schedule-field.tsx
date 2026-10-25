import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { DateField } from '@/components/date-field';
import { SegmentedControl } from '@/components/segmented-control';
import { strings } from '@/i18n/strings';
import { spacing, useTheme } from '@/theme';

export type ScheduleMode = 'every' | 'specific';

const OPTIONS = [
  { value: 'every', label: strings.goalForm.everyPeriod },
  { value: 'specific', label: strings.goalForm.specificPeriod },
] as const;

interface ScheduleFieldProps {
  mode: ScheduleMode;
  onModeChange: (mode: ScheduleMode) => void;
  date: Date;
  onDateChange: (date: Date) => void;
}

/**
 * "Every period" or one concrete period. The date only matters in specific
 * mode; the form derives the actual range from the goal's period.
 */
export function ScheduleField({ mode, onModeChange, date, onDateChange }: ScheduleFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <AppText variant="label" color={theme.textMuted}>
        {strings.goalForm.schedule}
      </AppText>
      <SegmentedControl options={OPTIONS} value={mode} onChange={onModeChange} />
      {mode === 'specific' ? (
        <DateField value={date} onChange={onDateChange} hint={strings.goalForm.scopeHint} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
});
