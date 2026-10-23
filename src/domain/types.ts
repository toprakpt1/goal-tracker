export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const PERIODS: readonly Period[] = ['daily', 'weekly', 'monthly', 'yearly'];

export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Tracker {
  id: string;
  name: string;
  unit: string;
  icon: string | null;
  color: string | null;
  defaultStep: number;
  archived: boolean;
  sortOrder: number;
  createdAt: number;
}

export interface Goal {
  id: string;
  trackerId: string;
  period: Period;
  target: number;
  reminderTime: string | null;
  archived: boolean;
  sortOrder: number;
  createdAt: number;
}

export interface GoalWithTracker extends Goal {
  tracker: Tracker;
}

export interface LogEntry {
  id: string;
  trackerId: string;
  amount: number;
  loggedAt: number;
  note: string | null;
}

/**
 * A period window in local time. `end` is exclusive, so SQL should use
 * `logged_at >= start AND logged_at < end`.
 */
export interface PeriodRange {
  start: Date;
  end: Date;
  key: string;
}
