import { create } from 'zustand';

import {
  DEFAULT_SETTINGS,
  loadSettings,
  persistSettings,
  type Settings,
} from '@/db/settings';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

let loadPromise: Promise<void> | null = null;

// Serialize writes so two quick preference changes cannot finish out of order
// and leave the older value on disk.
let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(settings: Settings): Promise<void> {
  const run = writeQueue.then(
    () => persistSettings(settings),
    () => persistSettings(settings),
  );
  writeQueue = run.catch(() => undefined);
  return run;
}

/**
 * A single in-memory copy of the settings. Every screen reads from this store,
 * so changing the theme or week start updates the whole app immediately and
 * only then gets persisted.
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,

  load: async () => {
    if (get().loaded) {
      return;
    }
    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = (async () => {
      try {
        const settings = await loadSettings();
        set({ settings, loaded: true });
      } catch {
        // Storage failures should never block the app; defaults stay usable.
        set({ loaded: true });
      } finally {
        loadPromise = null;
      }
    })();

    return loadPromise;
  },

  update: async (patch) => {
    const previous = get().settings;
    const next = { ...previous, ...patch };
    set({ settings: next });

    try {
      await enqueueWrite(next);
    } catch (error) {
      // Only roll back if no newer update replaced this one in the meantime.
      if (get().settings === next) {
        set({ settings: previous });
      }
      throw error;
    }
  },
}));
