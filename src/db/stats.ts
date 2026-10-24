import type { SQLiteDatabase } from 'expo-sqlite';

import { getStreakSummary } from '@/domain/streak';
import type { GoalWithTracker, LogEntry, WeekStartsOn } from '@/domain/types';

import { listGoalsWithTracker } from './repositories/goals';
import { listAllLogs } from './repositories/logs';

export interface GoalStreak {
  goal: GoalWithTracker;
  current: number;
  best: number;
  total: number;
}

export interface StatsData {
  goals: GoalStreak[];
  weekStartsOn: WeekStartsOn;
  /** Goals that have a streak covering the current or previous period. */
  activeStreaks: number;
  loadedAt: number;
}

/**
 * Streaks are derived from logs with the current target, so this only needs
 * two queries: every active goal and every log. Logs are grouped by tracker
 * once, then reused for each goal of that tracker.
 */
export async function loadStats(
  db: SQLiteDatabase,
  now: Date,
  weekStartsOn: WeekStartsOn = 1,
): Promise<StatsData> {
  const [goals, logs] = await Promise.all([listGoalsWithTracker(db), listAllLogs(db)]);

  const logsByTracker = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const existing = logsByTracker.get(log.trackerId);
    if (existing) {
      existing.push(log);
    } else {
      logsByTracker.set(log.trackerId, [log]);
    }
  }

  const rows: GoalStreak[] = goals.map((goal) => {
    const summary = getStreakSummary(
      goal.period,
      goal.target,
      logsByTracker.get(goal.trackerId) ?? [],
      now,
      weekStartsOn,
    );

    return { goal, ...summary };
  });

  return {
    goals: rows,
    weekStartsOn,
    activeStreaks: rows.filter((row) => row.current > 0).length,
    loadedAt: now.getTime(),
  };
}
