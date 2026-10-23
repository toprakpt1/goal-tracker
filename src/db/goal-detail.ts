import type { SQLiteDatabase } from 'expo-sqlite';

import { getPeriodRange } from '@/domain/period';
import type { GoalWithTracker, LogEntry, PeriodRange, WeekStartsOn } from '@/domain/types';

import { getGoalWithTracker } from './repositories/goals';
import { listLogsForTracker, listLogsForTrackerBetween } from './repositories/logs';

export interface GoalDetailData {
  goal: GoalWithTracker;
  range: PeriodRange;
  /** Logs inside the current period; used for the progress calculation. */
  periodLogs: LogEntry[];
  /** Newest-first history for the tracker, potentially older than the period. */
  recentLogs: LogEntry[];
}

/**
 * The progress total and the visible history need different log windows, so
 * load them together to keep the detail screen consistent.
 */
export async function loadGoalDetail(
  db: SQLiteDatabase,
  goalId: string,
  now: Date,
  weekStartsOn: WeekStartsOn = 1,
): Promise<GoalDetailData | null> {
  const goal = await getGoalWithTracker(db, goalId);
  if (!goal) {
    return null;
  }

  const range = getPeriodRange(goal.period, now, weekStartsOn);
  const [periodLogs, recentLogs] = await Promise.all([
    listLogsForTrackerBetween(db, goal.trackerId, range.start.getTime(), range.end.getTime()),
    listLogsForTracker(db, goal.trackerId, 20),
  ]);

  return { goal, range, periodLogs, recentLogs };
}
