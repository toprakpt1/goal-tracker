import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/app-text';
import { radius, fontFamily, spacing, useTheme } from '@/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string | null;
  suffix?: string;
}

export function TextField({
  label,
  hint,
  error,
  suffix,
  onFocus,
  onBlur,
  multiline,
  ...inputProps
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;

  return (
    <View style={styles.field}>
      {label ? (
        <AppText variant="label" color={theme.textMuted}>
          {label}
        </AppText>
      ) : null}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.surfaceMuted,
            borderColor,
          },
          multiline && styles.multilineRow,
        ]}
      >
        <TextInput
          {...inputProps}
          multiline={multiline}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={theme.textMuted}
          selectionColor={theme.primary}
          style={[styles.input, multiline && styles.multilineInput, { color: theme.text }]}
        />
        {suffix ? (
          <AppText variant="bodyStrong" color={theme.textMuted}>
            {suffix}
          </AppText>
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" color={theme.danger}>
          {error}
        </AppText>
      ) : hint ? (
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  multilineRow: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  multilineInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
});
