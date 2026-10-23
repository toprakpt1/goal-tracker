import type { SQLiteDatabase } from 'expo-sqlite';

import { getPeriodRange } from '@/domain/period';
import type { GoalWithTracker, LogEntry, WeekStartsOn } from '@/domain/types';

import { listGoalsWithTracker } from './repositories/goals';
import { listLogsBetween } from './repositories/logs';

export interface DashboardData {
  goals: GoalWithTracker[];
  logsByTracker: Map<string, LogEntry[]>;
  weekStartsOn: WeekStartsOn;
  loadedAt: number;
}

/**
 * Loads everything Today needs in two queries: active goals (with their
 * tracker) and the logs that fall inside any of the four current periods.
 *
 * A current week can start in the previous year, so the fetch window starts at
 * the earlier of the yearly and weekly boundaries.
 */
export async function loadDashboard(
  db: SQLiteDatabase,
  now: Date,
  weekStartsOn: WeekStartsOn = 1,
): Promise<DashboardData> {
  const yearly = getPeriodRange('yearly', now);
  const weekly = getPeriodRange('weekly', now, weekStartsOn);
  const rangeStart = Math.min(yearly.start.getTime(), weekly.start.getTime());
  const rangeEnd = Math.max(yearly.end.getTime(), weekly.end.getTime());

  const [goals, logs] = await Promise.all([
    listGoalsWithTracker(db),
    listLogsBetween(db, rangeStart, rangeEnd),
  ]);

  const logsByTracker = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const existing = logsByTracker.get(log.trackerId);
    if (existing) {
      existing.push(log);
    } else {
      logsByTracker.set(log.trackerId, [log]);
    }
  }

  return { goals, logsByTracker, weekStartsOn, loadedAt: now.getTime() };
}
