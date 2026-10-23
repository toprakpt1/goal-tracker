import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

interface ProgressBarProps {
  ratio: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ ratio, color, height = 8 }: ProgressBarProps) {
  const theme = useTheme();
  const width = `${Math.round(Math.min(Math.max(ratio, 0), 1) * 100)}%` as const;

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: theme.track, height, borderRadius: height / 2 },
      ]}
    >
      <View
        style={[
          styles.fill,
          { backgroundColor: color ?? theme.primary, width, borderRadius: height / 2 },
        ]}
      />
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
