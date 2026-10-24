import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { strings } from '@/i18n/strings';
import { radius, spacing, useTheme } from '@/theme';

export interface OptionSheetOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface OptionSheetProps<T extends string> {
  visible: boolean;
  title: string;
  value: T;
  options: readonly OptionSheetOption<T>[];
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function OptionSheet<T extends string>({
  visible,
  title,
  value,
  options,
  onSelect,
  onClose,
}: OptionSheetProps<T>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={strings.common.close}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          <AppText variant="heading">{title}</AppText>

          <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            {options.map((option, index) => {
              const selected = option.value === value;
              return (
                <View key={option.value}>
                  {index > 0 ? (
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  ) : null}
                  <Pressable
                    onPress={() => onSelect(option.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  >
                    <View style={styles.textBlock}>
                      <AppText variant="body">{option.label}</AppText>
                      {option.hint ? (
                        <AppText variant="caption" color={theme.textMuted}>
                          {option.hint}
                        </AppText>
                      ) : null}
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <AppText variant="bodyStrong" color={theme.textMuted}>
              {strings.common.close}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
  },
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
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.65,
  },
  close: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
