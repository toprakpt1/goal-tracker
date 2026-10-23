import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { migrate } from '@/db/migrations';
import { DATABASE_NAME } from '@/db/schema';
import { useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate}>
          <AppShell />
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const theme = useTheme();
  const base = theme.isDark ? DarkTheme : DefaultTheme;

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = {
  root: { flex: 1 },
} as const;
