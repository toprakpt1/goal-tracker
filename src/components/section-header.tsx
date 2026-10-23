import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useTheme, spacing } from '@/theme';

interface SectionHeaderProps {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}

export function SectionHeader({ title, count, expanded, onToggle }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.titleRow}>
        <AppText variant="heading" numberOfLines={1}>
          {title}
        </AppText>
        <View style={[styles.count, { backgroundColor: theme.surfaceMuted }]}>
          <AppText variant="caption" color={theme.textMuted}>
            {count}
          </AppText>
        </View>
      </View>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={theme.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  count: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
