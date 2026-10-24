import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import type { Settings } from '@/db/settings';
import { listGoalsWithTracker } from '@/db/repositories/goals';
import { strings } from '@/i18n/strings';
import * as Notifications from '@/lib/notifications';
import {
  AndroidImportance,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
} from '@/lib/notifications';
import { parseReminderTime } from '@/lib/reminder-time';

export const REMINDER_CHANNEL_ID = 'goal-reminders';

/** Android 13 requires a channel before the notification permission prompt. */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: strings.reminders.channelName,
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#F5A524',
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  const permissions = await Notifications.getPermissionsAsync();
  return (
    permissions.granted ||
    permissions.ios?.status === IosAuthorizationStatus.PROVISIONAL
  );
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureNotificationChannel();

  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  if (!current.canAskAgain) {
    return false;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === IosAuthorizationStatus.PROVISIONAL
  );
}

// Scheduling and cancelling share one queue, so a sync that is already running
// cannot re-create a reminder right after the user turned notifications off.
let reminderQueue: Promise<void> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const run = reminderQueue.then(operation, operation);
  reminderQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function cancelAllReminders(): Promise<void> {
  return enqueue(() => Notifications.cancelAllScheduledNotificationsAsync());
}

/**
 * Rebuilds the local daily reminders from the goals that have a time.
 *
 * All periods of a tracker share one log stream, so two goals at the same time
 * produce a single notification. Different times are kept separate.
 */
export function syncReminders(
  db: SQLiteDatabase,
  settings: Settings,
): Promise<number> {
  return enqueue(() => performSync(db, settings));
}

async function performSync(db: SQLiteDatabase, settings: Settings): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.notificationsEnabled || !(await hasNotificationPermission())) {
    return 0;
  }

  await ensureNotificationChannel();

  const goals = (await listGoalsWithTracker(db)).filter((goal) => goal.reminderTime);
  const scheduled = new Set<string>();
  let count = 0;

  for (const goal of goals) {
    const time = parseReminderTime(goal.reminderTime ?? '');
    if (!time) {
      continue;
    }

    const key = `${goal.trackerId}:${time.hour}:${time.minute}`;
    if (scheduled.has(key)) {
      continue;
    }
    scheduled.add(key);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: strings.reminders.notificationTitle(goal.tracker.name),
        body: strings.reminders.notificationBody,
        sound: settings.soundEnabled ? 'default' : false,
        data: { goalId: goal.id },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
    count += 1;
  }

  return count;
}
