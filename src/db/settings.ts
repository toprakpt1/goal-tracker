import Storage from 'expo-sqlite/kv-store';

import type { WeekStartsOn } from '@/domain/types';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  weekStartsOn: WeekStartsOn;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  theme: ThemePreference;
  onboardingComplete: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  weekStartsOn: 1,
  soundEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: false,
  theme: 'system',
  onboardingComplete: false,
};

const SETTINGS_KEY = 'settings.v1';

export async function loadSettings(): Promise<Settings> {
  const raw = await Storage.getItemAsync(SETTINGS_KEY);
  if (!raw) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...(parsed as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch };
  await persistSettings(next);
  return next;
}

/** Writes the complete settings object, avoiding read-modify-write races. */
export async function persistSettings(settings: Settings): Promise<void> {
  await Storage.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
}

export async function resetSettings(): Promise<void> {
  await Storage.removeItemAsync(SETTINGS_KEY);
}
