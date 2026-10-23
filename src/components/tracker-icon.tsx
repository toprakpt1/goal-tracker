import type { LucideProps } from 'lucide-react-native';

import Target from 'lucide-react-native/icons/target';

import { resolveTrackerIconName, TRACKER_ICON_MAP } from '@/lib/icon-catalog';

type TrackerIconProps = Omit<LucideProps, 'icon'> & {
  icon: string | null | undefined;
};

/** Renders the Lucide icon stored on a tracker, with a safe fallback. */
export function TrackerIcon({ icon, ...rest }: TrackerIconProps) {
  const Icon = TRACKER_ICON_MAP[resolveTrackerIconName(icon)] ?? Target;
  return <Icon {...rest} />;
}
