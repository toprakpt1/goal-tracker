import { useEffect, useState } from 'react';

import { DEFAULT_SETTINGS, loadSettings, type Settings } from '@/db/settings';

export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;
    loadSettings().then((loaded) => {
      if (active) {
        setSettings(loaded);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return settings;
}
