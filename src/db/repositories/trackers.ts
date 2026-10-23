import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Tracker } from '@/domain/types';

interface TrackerRow {
  id: string;
  name: string;
  unit: string;
  icon: string | null;
  color: string | null;
  default_step: number;
  archived: number;
  sort_order: number;
  created_at: number;
}

export interface CreateTrackerInput {
  name: string;
  unit: string;
  icon?: string | null;
  color?: string | null;
  defaultStep?: number;
  sortOrder?: number;
}

export interface UpdateTrackerInput {
  name?: string;
  unit?: string;
  icon?: string | null;
  color?: string | null;
  defaultStep?: number;
}

function mapTracker(row: TrackerRow): Tracker {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    icon: row.icon,
    color: row.color,
    defaultStep: row.default_step,
    archived: row.archived === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function listTrackers(
  db: SQLiteDatabase,
  options: { includeArchived?: boolean } = {},
): Promise<Tracker[]> {
  const where = options.includeArchived ? '' : 'WHERE archived = 0';
  const rows = await db.getAllAsync<TrackerRow>(
    `SELECT * FROM trackers ${where} ORDER BY sort_order ASC, created_at ASC`,
  );
  return rows.map(mapTracker);
}

export async function countTrackers(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM trackers');
  return row?.count ?? 0;
}

export async function getTracker(db: SQLiteDatabase, trackerId: string): Promise<Tracker | null> {
  const row = await db.getFirstAsync<TrackerRow>('SELECT * FROM trackers WHERE id = ?', trackerId);
  return row ? mapTracker(row) : null;
}

export async function createTracker(
  db: SQLiteDatabase,
  input: CreateTrackerInput,
): Promise<Tracker> {
  const tracker: Tracker = {
    id: randomUUID(),
    name: input.name.trim(),
    unit: input.unit.trim(),
    icon: input.icon ?? null,
    color: input.color ?? null,
    defaultStep: input.defaultStep ?? 1,
    archived: false,
    sortOrder: input.sortOrder ?? 0,
    createdAt: Date.now(),
  };

  if (!tracker.name || !tracker.unit) {
    throw new Error('A tracker needs a name and a unit.');
  }

  await db.runAsync(
    `INSERT INTO trackers (id, name, unit, icon, color, default_step, archived, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    tracker.id,
    tracker.name,
    tracker.unit,
    tracker.icon,
    tracker.color,
    tracker.defaultStep,
    tracker.sortOrder,
    tracker.createdAt,
  );

  return tracker;
}

export async function updateTracker(
  db: SQLiteDatabase,
  trackerId: string,
  input: UpdateTrackerInput,
): Promise<void> {
  const current = await getTracker(db, trackerId);
  if (!current) {
    throw new Error('This tracker no longer exists.');
  }

  const name = (input.name ?? current.name).trim();
  const unit = (input.unit ?? current.unit).trim();
  const defaultStep = input.defaultStep ?? current.defaultStep;

  if (!name || !unit) {
    throw new Error('A tracker needs a name and a unit.');
  }
  if (!Number.isFinite(defaultStep) || !(defaultStep > 0)) {
    throw new Error('The quick-add step must be greater than zero.');
  }

  await db.runAsync(
    `UPDATE trackers SET name = ?, unit = ?, icon = ?, color = ?, default_step = ? WHERE id = ?`,
    name,
    unit,
    input.icon === undefined ? current.icon : input.icon,
    input.color === undefined ? current.color : input.color,
    defaultStep,
    trackerId,
  );
}

/** Archives the tracker and all of its goals, keeping history for later. */
export async function archiveTracker(db: SQLiteDatabase, trackerId: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE goals SET archived = 1 WHERE tracker_id = ?', trackerId);
    await db.runAsync('UPDATE trackers SET archived = 1 WHERE id = ?', trackerId);
  });
}
