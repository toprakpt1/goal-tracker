import type { SQLiteDatabase } from 'expo-sqlite';

import { getPeriodRange } from '@/domain/period';
import { getGoalScopeRange, isGoalActiveAt } from '@/domain/scope';
import type { GoalWithTracker, LogEntry, PeriodRange, WeekStartsOn } from '@/domain/types';

import { getGoalWithTracker } from './repositories/goals';
import {
  listAllLogsForTracker,
  listLogsForTracker,
  listLogsForTrackerBetween,
} from './repositories/logs';

export interface GoalDetailData {
  goal: GoalWithTracker;
  range: PeriodRange;
  /** True when the goal applies to the current period. */
  isActiveNow: boolean;
  /** Logs inside the goal's range; used for the progress calculation. */
  periodLogs: LogEntry[];
  /** Newest-first history for the tracker, potentially older than the period. */
  recentLogs: LogEntry[];
  /** Oldest-first tracker history inside the goal's scope, used for streaks. */
  streakLogs: LogEntry[];
}

/**
 * The progress total and the visible history need different log windows, so
 * load them together to keep the detail screen consistent.
 *
 * A scoped goal always shows its own window, even when it is in the future or
 * already over; a recurring goal follows the current period.
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

  const scopeRange = getGoalScopeRange(goal, weekStartsOn);
  const range = scopeRange ?? getPeriodRange(goal.period, now, weekStartsOn);
  const isActiveNow = isGoalActiveAt(goal, now, weekStartsOn);

  const [periodLogs, recentLogs, allLogs] = await Promise.all([
    listLogsForTrackerBetween(db, goal.trackerId, range.start.getTime(), range.end.getTime()),
    listLogsForTracker(db, goal.trackerId, 20),
    listAllLogsForTracker(db, goal.trackerId),
  ]);

  const streakLogs = scopeRange
    ? allLogs.filter(
        (log) =>
          log.loggedAt >= scopeRange.start.getTime() &&
          log.loggedAt < scopeRange.end.getTime(),
      )
    : allLogs;

  return { goal, range, isActiveNow, periodLogs, recentLogs, streakLogs };
}
