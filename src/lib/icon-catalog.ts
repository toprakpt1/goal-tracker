import type { LucideIcon } from 'lucide-react-native';

import Apple from 'lucide-react-native/icons/apple';
import Bike from 'lucide-react-native/icons/bike';
import Book from 'lucide-react-native/icons/book';
import BookOpen from 'lucide-react-native/icons/book-open';
import Brain from 'lucide-react-native/icons/brain';
import Briefcase from 'lucide-react-native/icons/briefcase';
import Camera from 'lucide-react-native/icons/camera';
import ChefHat from 'lucide-react-native/icons/chef-hat';
import Code from 'lucide-react-native/icons/code';
import Coffee from 'lucide-react-native/icons/coffee';
import Droplets from 'lucide-react-native/icons/droplets';
import Dumbbell from 'lucide-react-native/icons/dumbbell';
import Footprints from 'lucide-react-native/icons/footprints';
import Gamepad2 from 'lucide-react-native/icons/gamepad-2';
import GlassWater from 'lucide-react-native/icons/glass-water';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import Heart from 'lucide-react-native/icons/heart';
import Languages from 'lucide-react-native/icons/languages';
import Leaf from 'lucide-react-native/icons/leaf';
import Moon from 'lucide-react-native/icons/moon';
import Music from 'lucide-react-native/icons/eighth-notes';
import Palette from 'lucide-react-native/icons/palette';
import Pencil from 'lucide-react-native/icons/pencil';
import PiggyBank from 'lucide-react-native/icons/piggy-bank';
import Sprout from 'lucide-react-native/icons/sprout';
import Sun from 'lucide-react-native/icons/sun';
import Target from 'lucide-react-native/icons/target';
import Timer from 'lucide-react-native/icons/timer';
import Wallet from 'lucide-react-native/icons/wallet';

export interface TrackerIconOption {
  name: string;
  label: string;
  Icon: LucideIcon;
}

/**
 * Curated set that covers common personal goals without turning the picker into
 * a 1,500-icon browser. Icon names are stored in the database, never glyphs.
 */
export const TRACKER_ICONS: readonly TrackerIconOption[] = [
  { name: 'target', label: 'Goal', Icon: Target },
  { name: 'book-open', label: 'Reading', Icon: BookOpen },
  { name: 'book', label: 'Books', Icon: Book },
  { name: 'pencil', label: 'Writing', Icon: Pencil },
  { name: 'graduation-cap', label: 'Learning', Icon: GraduationCap },
  { name: 'languages', label: 'Language', Icon: Languages },
  { name: 'code', label: 'Code', Icon: Code },
  { name: 'brain', label: 'Focus', Icon: Brain },
  { name: 'dumbbell', label: 'Workout', Icon: Dumbbell },
  { name: 'footprints', label: 'Walking', Icon: Footprints },
  { name: 'bike', label: 'Cycling', Icon: Bike },
  { name: 'heart', label: 'Health', Icon: Heart },
  { name: 'droplets', label: 'Water', Icon: Droplets },
  { name: 'glass-water', label: 'Drinking', Icon: GlassWater },
  { name: 'apple', label: 'Food', Icon: Apple },
  { name: 'chef-hat', label: 'Cooking', Icon: ChefHat },
  { name: 'moon', label: 'Sleep', Icon: Moon },
  { name: 'sun', label: 'Morning', Icon: Sun },
  { name: 'timer', label: 'Time', Icon: Timer },
  { name: 'sprout', label: 'Habit', Icon: Sprout },
  { name: 'leaf', label: 'Nature', Icon: Leaf },
  { name: 'piggy-bank', label: 'Savings', Icon: PiggyBank },
  { name: 'wallet', label: 'Money', Icon: Wallet },
  { name: 'briefcase', label: 'Work', Icon: Briefcase },
  { name: 'coffee', label: 'Coffee', Icon: Coffee },
  { name: 'music', label: 'Music', Icon: Music },
  { name: 'palette', label: 'Art', Icon: Palette },
  { name: 'camera', label: 'Photo', Icon: Camera },
  { name: 'gamepad-2', label: 'Games', Icon: Gamepad2 },
];

export const TRACKER_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  TRACKER_ICONS.map((option) => [option.name, option.Icon]),
);

export const DEFAULT_TRACKER_ICON = 'target';

/** Icons used by the M1 demo data. Mapped once in schema v2 as well. */
const LEGACY_ICON_NAMES: Record<string, string> = {
  '📚': 'book-open',
  '📖': 'book',
  '💧': 'droplets',
  '🏋️': 'dumbbell',
  '🏋': 'dumbbell',
};

/** Resolves a stored icon name (or a legacy emoji) to a catalog key. */
export function resolveTrackerIconName(icon: string | null | undefined): string {
  if (!icon) {
    return DEFAULT_TRACKER_ICON;
  }
  if (TRACKER_ICON_MAP[icon]) {
    return icon;
  }
  return LEGACY_ICON_NAMES[icon] ?? DEFAULT_TRACKER_ICON;
}
