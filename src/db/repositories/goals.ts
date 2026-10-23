import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Goal, GoalWithTracker, Period, Tracker } from '@/domain/types';

interface GoalRow {
  id: string;
  tracker_id: string;
  period: Period;
  target: number;
  reminder_time: string | null;
  archived: number;
  sort_order: number;
  created_at: number;
}

interface GoalWithTrackerRow extends GoalRow {
  tracker_name: string;
  tracker_unit: string;
  tracker_icon: string | null;
  tracker_color: string | null;
  tracker_default_step: number;
  tracker_archived: number;
  tracker_sort_order: number;
  tracker_created_at: number;
}

export interface CreateGoalInput {
  trackerId: string;
  period: Period;
  target: number;
  reminderTime?: string | null;
  sortOrder?: number;
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    trackerId: row.tracker_id,
    period: row.period,
    target: row.target,
    reminderTime: row.reminder_time,
    archived: row.archived === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapTracker(row: GoalWithTrackerRow): Tracker {
  return {
    id: row.tracker_id,
    name: row.tracker_name,
    unit: row.tracker_unit,
    icon: row.tracker_icon,
    color: row.tracker_color,
    defaultStep: row.tracker_default_step,
    archived: row.tracker_archived === 1,
    sortOrder: row.tracker_sort_order,
    createdAt: row.tracker_created_at,
  };
}

export async function listGoals(
  db: SQLiteDatabase,
  options: { includeArchived?: boolean } = {},
): Promise<Goal[]> {
  const where = options.includeArchived ? '' : 'WHERE archived = 0';
  const rows = await db.getAllAsync<GoalRow>(
    `SELECT * FROM goals ${where} ORDER BY sort_order ASC, created_at ASC`,
  );
  return rows.map(mapGoal);
}

export async function listGoalsWithTracker(
  db: SQLiteDatabase,
  options: { includeArchived?: boolean } = {},
): Promise<GoalWithTracker[]> {
  const archivedFilter = options.includeArchived ? '' : 'AND g.archived = 0 AND t.archived = 0';
  const rows = await db.getAllAsync<GoalWithTrackerRow>(
    `SELECT
       g.*,
       t.name AS tracker_name,
       t.unit AS tracker_unit,
       t.icon AS tracker_icon,
       t.color AS tracker_color,
       t.default_step AS tracker_default_step,
       t.archived AS tracker_archived,
       t.sort_order AS tracker_sort_order,
       t.created_at AS tracker_created_at
     FROM goals g
     JOIN trackers t ON t.id = g.tracker_id
     WHERE 1 = 1 ${archivedFilter}
     ORDER BY t.sort_order ASC, g.sort_order ASC, g.created_at ASC`,
  );

  return rows.map((row) => ({ ...mapGoal(row), tracker: mapTracker(row) }));
}

export async function createGoal(db: SQLiteDatabase, input: CreateGoalInput): Promise<Goal> {
  if (!(input.target > 0)) {
    throw new Error('A goal target must be greater than zero.');
  }

  const goal: Goal = {
    id: randomUUID(),
    trackerId: input.trackerId,
    period: input.period,
    target: input.target,
    reminderTime: input.reminderTime ?? null,
    archived: false,
    sortOrder: input.sortOrder ?? 0,
    createdAt: Date.now(),
  };

  await db.runAsync(
    `INSERT INTO goals (id, tracker_id, period, target, reminder_time, archived, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    goal.id,
    goal.trackerId,
    goal.period,
    goal.target,
    goal.reminderTime,
    goal.sortOrder,
    goal.createdAt,
  );

  return goal;
}
