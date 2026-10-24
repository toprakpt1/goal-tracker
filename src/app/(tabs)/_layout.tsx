import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { strings } from '@/i18n/strings';
import { withAlpha } from '@/lib/color';
import { fontFamily, useTheme } from '@/theme';

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
          backgroundColor: '#16110E',
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 68,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          paddingBottom: 6,
        },
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.today,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused} color={color} size={size} name="sunny" />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: strings.tabs.goals,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused} color={color} size={size} name="flag" />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: strings.tabs.stats,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused} color={color} size={size} name="stats-chart" />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  focused,
  color,
  size,
  name,
}: {
  focused: boolean;
  color: ColorValue;
  size: number;
  name: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();
  const inactive = typeof color === 'string' ? color : theme.textMuted;

  return (
    <View
      style={[
        styles.iconWrap,
        focused && { backgroundColor: withAlpha(theme.primary, 0.16) },
      ]}
    >
      <Ionicons
        name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
        size={size - 2}
        color={focused ? theme.primary : inactive}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 11,
  },
});
