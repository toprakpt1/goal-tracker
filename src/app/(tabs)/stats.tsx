import { useTheme } from '@/theme';

import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { strings } from '@/i18n/strings';
import { StyleSheet, View } from 'react-native';

export default function StatsScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="display">{strings.stats.title}</AppText>
        <AppText variant="body" color={theme.textMuted}>
          {strings.stats.subtitle}
        </AppText>
      </View>

      <EmptyState
        icon="stats-chart-outline"
        title={strings.stats.emptyTitle}
        body={strings.stats.emptyBody}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
});
