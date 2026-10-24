import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { LogEntry } from '@/domain/types';

interface LogRow {
  id: string;
  tracker_id: string;
  amount: number;
  logged_at: number;
  note: string | null;
}

export interface CreateLogInput {
  trackerId: string;
  amount: number;
  loggedAt?: number;
  note?: string | null;
}

function mapLog(row: LogRow): LogEntry {
  return {
    id: row.id,
    trackerId: row.tracker_id,
    amount: row.amount,
    loggedAt: row.logged_at,
    note: row.note,
  };
}

/** Logs with `start <= logged_at < end`. */
export async function listLogsBetween(
  db: SQLiteDatabase,
  start: number,
  end: number,
): Promise<LogEntry[]> {
  const rows = await db.getAllAsync<LogRow>(
    `SELECT * FROM logs
     WHERE logged_at >= ? AND logged_at < ?
     ORDER BY logged_at ASC`,
    start,
    end,
  );
  return rows.map(mapLog);
}

export async function listLogsForTrackerBetween(
  db: SQLiteDatabase,
  trackerId: string,
  start: number,
  end: number,
): Promise<LogEntry[]> {
  const rows = await db.getAllAsync<LogRow>(
    `SELECT * FROM logs
     WHERE tracker_id = ? AND logged_at >= ? AND logged_at < ?
     ORDER BY logged_at ASC`,
    trackerId,
    start,
    end,
  );
  return rows.map(mapLog);
}

export async function countLogs(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM logs');
  return row?.count ?? 0;
}

/** Oldest first. Used for streak history across every tracker. */
export async function listAllLogs(db: SQLiteDatabase): Promise<LogEntry[]> {
  const rows = await db.getAllAsync<LogRow>('SELECT * FROM logs ORDER BY logged_at ASC');
  return rows.map(mapLog);
}

/** Oldest first. Used for a single tracker's streak history. */
export async function listAllLogsForTracker(
  db: SQLiteDatabase,
  trackerId: string,
): Promise<LogEntry[]> {
  const rows = await db.getAllAsync<LogRow>(
    `SELECT * FROM logs
     WHERE tracker_id = ?
     ORDER BY logged_at ASC`,
    trackerId,
  );
  return rows.map(mapLog);
}

/** Newest first. Used by the goal detail history. */
export async function listLogsForTracker(
  db: SQLiteDatabase,
  trackerId: string,
  limit = 20,
): Promise<LogEntry[]> {
  const rows = await db.getAllAsync<LogRow>(
    `SELECT * FROM logs
     WHERE tracker_id = ?
     ORDER BY logged_at DESC
     LIMIT ?`,
    trackerId,
    limit,
  );
  return rows.map(mapLog);
}

export async function createLog(db: SQLiteDatabase, input: CreateLogInput): Promise<LogEntry> {
  if (!(input.amount > 0)) {
    throw new Error('A log amount must be greater than zero.');
  }

  const log: LogEntry = {
    id: randomUUID(),
    trackerId: input.trackerId,
    amount: input.amount,
    loggedAt: input.loggedAt ?? Date.now(),
    note: input.note?.trim() || null,
  };

  await db.runAsync(
    `INSERT INTO logs (id, tracker_id, amount, logged_at, note) VALUES (?, ?, ?, ?, ?)`,
    log.id,
    log.trackerId,
    log.amount,
    log.loggedAt,
    log.note,
  );

  return log;
}

export async function deleteLog(db: SQLiteDatabase, logId: string): Promise<void> {
  await db.runAsync('DELETE FROM logs WHERE id = ?', logId);
}
