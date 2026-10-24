import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';

import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

interface CheckToggleProps {
  checked: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  color?: string;
  size?: number;
  label?: string;
  disabled?: boolean;
}

/** Circular checkbox used by checklist goals in cards, rows and forms. */
export function CheckToggle({
  checked,
  onPress,
  color,
  size = 34,
  label,
  disabled = false,
}: CheckToggleProps) {
  const theme = useTheme();
  const tint = color ?? theme.primary;
  const isDisabled = disabled || !onPress;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: isDisabled }}
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: checked ? tint : theme.border,
          backgroundColor: checked ? withAlpha(tint, 0.16) : theme.surface,
        },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {checked ? <Ionicons name="checkmark" size={size * 0.58} color={tint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.65,
  },
});
