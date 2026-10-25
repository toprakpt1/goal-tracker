import type { SQLiteDatabase } from 'expo-sqlite';

import { getProgress, type Progress } from '@/domain/progress';
import { getGoalActiveRange } from '@/domain/scope';
import type { GoalWithTracker, LogEntry, PeriodRange, WeekStartsOn } from '@/domain/types';

import { listGoalsWithTracker } from './repositories/goals';
import {
  createLog,
  deleteLogsForTrackerBetween,
  listLogsForTrackerBetween,
  type CreateLogInput,
} from './repositories/logs';
import {
  completionKey,
  insertCompletion,
  listCompletionKeysForTracker,
} from './repositories/completions';

export interface NewCompletion {
  goal: GoalWithTracker;
  range: PeriodRange;
  progress: Progress;
}

export interface LogSaveResult {
  log: LogEntry;
  /** Goals that crossed their target for the first time in this period. */
  completions: NewCompletion[];
}

/**
 * Creates one log, then checks every active goal of its tracker. A single log
 * can complete a daily, weekly, monthly, and yearly goal at once.
 *
 * Completions are recorded in the same transaction as the log, so a celebration
 * can never be shown twice for the same goal and period.
 */
export async function createLogWithCompletions(
  db: SQLiteDatabase,
  input: CreateLogInput,
  now: Date = new Date(),
  weekStartsOn: WeekStartsOn = 1,
): Promise<LogSaveResult> {
  const result: { log?: LogEntry; completions: NewCompletion[] } = { completions: [] };

  await db.withTransactionAsync(async () => {
    result.log = await createLog(db, input);
    result.completions = await detectCompletions(db, input.trackerId, now, weekStartsOn);
  });

  if (!result.log) {
    throw new Error('The log could not be saved.');
  }

  return { log: result.log, completions: result.completions };
}

async function detectCompletions(
  db: SQLiteDatabase,
  trackerId: string,
  now: Date,
  weekStartsOn: WeekStartsOn,
): Promise<NewCompletion[]> {
  const goals = (await listGoalsWithTracker(db)).filter((goal) => goal.trackerId === trackerId);
  if (goals.length === 0) {
    return [];
  }

  // A scoped goal can only be completed while it is active. Future and expired
  // goals stay out of the celebration path entirely.
  const active = goals.flatMap((goal) => {
    const range = getGoalActiveRange(goal, now, weekStartsOn);
    return range ? [{ goal, range }] : [];
  });
  if (active.length === 0) {
    return [];
  }

  const rangeStart = Math.min(...active.map((entry) => entry.range.start.getTime()));
  const rangeEnd = Math.max(...active.map((entry) => entry.range.end.getTime()));

  const [logs, recorded] = await Promise.all([
    listLogsForTrackerBetween(db, trackerId, rangeStart, rangeEnd),
    listCompletionKeysForTracker(db, trackerId),
  ]);

  const completions: NewCompletion[] = [];

  for (const { goal, range } of active) {
    const progress = getProgress(goal.target, logs, range);

    if (!progress.isComplete) {
      continue;
    }

    const key = completionKey(goal.id, range.key);
    if (recorded.has(key)) {
      continue;
    }

    await insertCompletion(db, goal.id, range.key, now.getTime());
    recorded.add(key);
    completions.push({ goal, range, progress });
  }

  return completions;
}

export interface CheckToggleResult {
  action: 'checked' | 'unchecked';
  /** Present when the toggle added a log. */
  result?: LogSaveResult;
  /** Number of logs removed when the toggle unticked a completed period. */
  removed: number;
}

/**
 * Checklist goals are binary per period: any log completes the period. Ticking
 * adds one log, unticking removes the tracker's logs inside that goal's period.
 */
export async function toggleCheckGoal(
  db: SQLiteDatabase,
  goal: GoalWithTracker,
  now: Date = new Date(),
  weekStartsOn: WeekStartsOn = 1,
): Promise<CheckToggleResult> {
  const range = getGoalActiveRange(goal, now, weekStartsOn);
  if (!range) {
    throw new Error('This goal is not active in the current period.');
  }

  const logs = await listLogsForTrackerBetween(
    db,
    goal.trackerId,
    range.start.getTime(),
    range.end.getTime(),
  );
  const progress = getProgress(goal.target, logs, range);

  if (progress.isComplete) {
    const removed = await deleteLogsForTrackerBetween(
      db,
      goal.trackerId,
      range.start.getTime(),
      range.end.getTime(),
    );
    return { action: 'unchecked', removed };
  }

  const result = await createLogWithCompletions(
    db,
    { trackerId: goal.trackerId, amount: 1 },
    now,
    weekStartsOn,
  );
  return { action: 'checked', result, removed: 0 };
}
