import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { gradients, useTheme } from '@/theme';

interface ProgressBarProps {
  ratio: number;
  color?: string;
  height?: number;
  gradient?: boolean;
}

export function ProgressBar({ ratio, color, height = 8, gradient = true }: ProgressBarProps) {
  const theme = useTheme();
  const width = `${Math.round(Math.min(Math.max(ratio, 0), 1) * 100)}%` as const;
  const useGradient = gradient && !color;

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: theme.track, height, borderRadius: height / 2 },
      ]}
    >
      {useGradient ? (
        <LinearGradient
          colors={gradients.ember}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width, borderRadius: height / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.fill,
            {
              backgroundColor: color ?? theme.primary,
              width,
              borderRadius: height / 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
