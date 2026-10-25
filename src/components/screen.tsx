import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradients, spacing, useTheme } from '@/theme';

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = true, contentContainerStyle }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Keep the end of the content above the system navigation bar. Tab screens
  // already end above the tab bar, so there this only adds breathing room.
  const contentSpacing = { paddingBottom: spacing.huge + insets.bottom };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <LinearGradient
        pointerEvents="none"
        colors={gradients.glow}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.glow}
      />

      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentSpacing, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.flex, contentSpacing, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  flex: {
    flex: 1,
  },
});
