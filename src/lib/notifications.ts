/**
 * Expo Go on Android does not ship `ExpoTopicSubscriptionModule`, but the
 * `expo-notifications` root entry point imports it eagerly. That makes every
 * root import throw on launch in Expo Go, even though we only use local
 * notifications.
 *
 * Import the individual modules instead. None of them touch topic
 * subscriptions, so local scheduling, permissions and responses keep working.
 * Remove this shim once the package entry point is safe in Expo Go again.
 */
export {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponse,
  getLastNotificationResponse,
} from 'expo-notifications/build/NotificationsEmitter';
export type { Notification } from 'expo-notifications/build/Notifications.types';
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
export { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';

export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { IosAuthorizationStatus } from 'expo-notifications/build/NotificationPermissions.types';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
