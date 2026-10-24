import { Pressable, StyleSheet, View } from 'react-native';

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
              selected && {
                borderColor: theme.text,
                borderWidth: 2,
                transform: [{ scale: 1.08 }],
              },
              pressed && styles.pressed,
            ]}
          >
            {selected ? (
              <View style={[styles.dot, { backgroundColor: theme.text }]} />
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
