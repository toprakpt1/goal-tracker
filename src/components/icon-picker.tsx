import { Pressable, StyleSheet, View } from 'react-native';

import { TRACKER_ICONS } from '@/lib/icon-catalog';
import { withAlpha } from '@/lib/color';
import { radius, spacing, useTheme } from '@/theme';

interface IconPickerProps {
  value: string | null;
  color: string;
  onChange: (name: string) => void;
}

export function IconPicker({ value, color, onChange }: IconPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {TRACKER_ICONS.map(({ name, label, Icon }) => {
        const selected = name === value;
        return (
          <Pressable
            key={name}
            onPress={() => onChange(name)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.cell,
              {
                borderColor: selected ? color : theme.border,
                backgroundColor: selected ? withAlpha(color, 0.16) : theme.surface,
              },
              pressed && styles.pressed,
            ]}
          >
            <Icon size={20} color={selected ? color : theme.textMuted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
