import type { SQLiteDatabase } from 'expo-sqlite';

interface CompletionKeyRow {
  goal_id: string;
  period_key: string;
}

/** Stable in-memory key for the `(goal, period)` completion pair. */
export function completionKey(goalId: string, periodKey: string): string {
  return `${goalId}::${periodKey}`;
}

/**
 * Every completion already recorded for a tracker's goals. Used to avoid
 * celebrating the same goal and period twice.
 */
export async function listCompletionKeysForTracker(
  db: SQLiteDatabase,
  trackerId: string,
): Promise<Set<string>> {
  const rows = await db.getAllAsync<CompletionKeyRow>(
    `SELECT c.goal_id, c.period_key
     FROM completions c
     JOIN goals g ON g.id = c.goal_id
     WHERE g.tracker_id = ?`,
    trackerId,
  );

  return new Set(rows.map((row) => completionKey(row.goal_id, row.period_key)));
}

export async function insertCompletion(
  db: SQLiteDatabase,
  goalId: string,
  periodKey: string,
  completedAt: number,
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO completions (goal_id, period_key, completed_at)
     VALUES (?, ?, ?)`,
    goalId,
    periodKey,
    completedAt,
  );
}
