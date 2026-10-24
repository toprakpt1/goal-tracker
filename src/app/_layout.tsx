import {
  Domine_400Regular,
  Domine_600SemiBold,
} from '@expo-google-fonts/domine';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { DarkTheme, Stack, ThemeProvider, router } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { migrate } from '@/db/migrations';
import { DATABASE_NAME } from '@/db/schema';
import * as Notifications from '@/lib/notifications';
import {
  cancelAllReminders,
  hasNotificationPermission,
  syncReminders,
} from '@/lib/reminders';
import { useSettingsStore } from '@/store/settings';
import { useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const { soundEnabled } = useSettingsStore.getState().settings;
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: soundEnabled,
      shouldSetBadge: false,
    };
  },
});

async function reconcileReminders(db: SQLiteDatabase): Promise<void> {
  const store = useSettingsStore.getState();
  if (!store.loaded) {
    return;
  }

  if (!store.settings.notificationsEnabled) {
    await cancelAllReminders().catch(() => undefined);
    return;
  }

  if (!(await hasNotificationPermission())) {
    await store.update({ notificationsEnabled: false }).catch(() => undefined);
    await cancelAllReminders().catch(() => undefined);
    return;
  }

  await syncReminders(db, store.settings).catch(() => undefined);
}

function useNotificationObserver() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const goalId = notification.request.content.data?.goalId;
      if (typeof goalId === 'string') {
        router.push({ pathname: '/goal/[id]', params: { id: goalId } });
      }
      Notifications.clearLastNotificationResponse();
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((event) => {
      redirect(event.notification);
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Domine_400Regular,
    Domine_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

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
  const db = useSQLiteContext();

  useNotificationObserver();

  useEffect(() => {
    let active = true;

    void (async () => {
      await useSettingsStore.getState().load();
      if (!active) {
        return;
      }

      await SplashScreen.hideAsync();
      await reconcileReminders(db);
    })();

    return () => {
      active = false;
    };
  }, [db]);

  // Permission can change while the app is in the background, for example after
  // "Open settings" on the permission alert. Reconcile when we come back so the
  // stored toggle never claims reminders are active without permission.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        return;
      }

      void reconcileReminders(db);
    });

    return () => {
      subscription.remove();
    };
  }, [db]);

  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.background,
      card: theme.surfaceElevated,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
      notification: theme.secondary,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goal/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goal/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goal/[id]" />
        <Stack.Screen name="tracker/[id]" />
      </Stack>
    </ThemeProvider>
  );
}

const styles = {
  root: { flex: 1 },
} as const;
