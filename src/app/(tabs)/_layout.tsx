import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { strings } from '@/i18n/strings';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.today,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'sunny' : 'sunny-outline'} size={size} color={typeof color === 'string' ? color : theme.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: strings.tabs.goals,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'flag' : 'flag-outline'} size={size} color={typeof color === 'string' ? color : theme.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: strings.tabs.stats,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={size}
              color={typeof color === 'string' ? color : theme.primary}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
