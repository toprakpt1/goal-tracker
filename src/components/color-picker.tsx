import { Pressable, StyleSheet, View } from 'react-native';

import { withAlpha } from '@/lib/color';
import { trackerPalette, useTheme } from '@/theme';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {trackerPalette.map((color) => {
        const selected = color === value;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            accessibilityRole="button"
            accessibilityLabel={color}
            accessibilityState={{ selected }}
            hitSlop={4}
            style={({ pressed }) => [
              styles.swatch,
              { backgroundColor: color },
              selected && { borderColor: theme.text, borderWidth: 3 },
              pressed && styles.pressed,
            ]}
          >
            {selected ? (
              <View style={[styles.dot, { backgroundColor: withAlpha('#FFFFFF', 0.9) }]} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
