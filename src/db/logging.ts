import type { SQLiteDatabase } from 'expo-sqlite';

import { getPeriodRange } from '@/domain/period';
import { getProgress, type Progress } from '@/domain/progress';
import type { GoalWithTracker, LogEntry, PeriodRange, WeekStartsOn } from '@/domain/types';

import { listGoalsWithTracker } from './repositories/goals';
import { createLog, listLogsForTrackerBetween, type CreateLogInput } from './repositories/logs';
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

  const ranges = goals.map((goal) => getPeriodRange(goal.period, now, weekStartsOn));
  const rangeStart = Math.min(...ranges.map((range) => range.start.getTime()));
  const rangeEnd = Math.max(...ranges.map((range) => range.end.getTime()));

  const [logs, recorded] = await Promise.all([
    listLogsForTrackerBetween(db, trackerId, rangeStart, rangeEnd),
    listCompletionKeysForTracker(db, trackerId),
  ]);

  const completions: NewCompletion[] = [];

  for (let index = 0; index < goals.length; index += 1) {
    const goal = goals[index];
    const range = ranges[index];
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
