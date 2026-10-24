import type { Settings } from '@/db/settings';
import { useSettingsStore } from '@/store/settings';

/** The live settings object; changes propagate to every screen immediately. */
export function useSettings(): Settings {
  return useSettingsStore((state) => state.settings);
}
