import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { spacing, useTheme } from '@/theme';

interface SettingsRowProps {
  label: string;
  hint?: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
}

export function SettingsRow({ label, hint, value, danger, onPress }: SettingsRowProps) {
  const theme = useTheme();
  const labelColor = danger ? theme.danger : theme.text;
  const content = (
    <>
      <View style={styles.textBlock}>
        <AppText variant="body" color={labelColor}>
          {label}
        </AppText>
        {hint ? (
          <AppText variant="caption" color={theme.textMuted}>
            {hint}
          </AppText>
        ) : null}
      </View>

      {value ? (
        <AppText variant="body" color={theme.textMuted}>
          {value}
        </AppText>
      ) : null}

      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.6,
  },
});
