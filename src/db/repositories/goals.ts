import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Goal, GoalWithTracker, Period, Tracker, TrackerKind } from '@/domain/types';

import { getTracker } from './trackers';

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
  tracker_kind: TrackerKind;
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

export interface UpdateGoalInput {
  period?: Period;
  target?: number;
  reminderTime?: string | null;
}

const GOAL_WITH_TRACKER_SELECT = `
  SELECT
    g.*,
    t.name AS tracker_name,
    t.kind AS tracker_kind,
    t.unit AS tracker_unit,
    t.icon AS tracker_icon,
    t.color AS tracker_color,
    t.default_step AS tracker_default_step,
    t.archived AS tracker_archived,
    t.sort_order AS tracker_sort_order,
    t.created_at AS tracker_created_at
  FROM goals g
  JOIN trackers t ON t.id = g.tracker_id
`;

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
    kind: row.tracker_kind,
    unit: row.tracker_unit,
    icon: row.tracker_icon,
    color: row.tracker_color,
    defaultStep: row.tracker_default_step,
    archived: row.tracker_archived === 1,
    sortOrder: row.tracker_sort_order,
    createdAt: row.tracker_created_at,
  };
}

function mapGoalWithTracker(row: GoalWithTrackerRow): GoalWithTracker {
  return { ...mapGoal(row), tracker: mapTracker(row) };
}

function assertTarget(target: number): void {
  if (!Number.isFinite(target) || !(target > 0)) {
    throw new Error('A goal target must be greater than zero.');
  }
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
    `${GOAL_WITH_TRACKER_SELECT}
     WHERE 1 = 1 ${archivedFilter}
     ORDER BY t.sort_order ASC, g.sort_order ASC, g.created_at ASC`,
  );

  return rows.map(mapGoalWithTracker);
}

export async function getGoal(
  db: SQLiteDatabase,
  goalId: string,
): Promise<Goal | null> {
  const row = await db.getFirstAsync<GoalRow>('SELECT * FROM goals WHERE id = ?', goalId);
  return row ? mapGoal(row) : null;
}

export async function getGoalWithTracker(
  db: SQLiteDatabase,
  goalId: string,
): Promise<GoalWithTracker | null> {
  const row = await db.getFirstAsync<GoalWithTrackerRow>(
    `${GOAL_WITH_TRACKER_SELECT} WHERE g.id = ?`,
    goalId,
  );
  return row ? mapGoalWithTracker(row) : null;
}

export async function listGoalsForTracker(
  db: SQLiteDatabase,
  trackerId: string,
): Promise<Goal[]> {
  const rows = await db.getAllAsync<GoalRow>(
    `SELECT * FROM goals
     WHERE tracker_id = ? AND archived = 0
     ORDER BY sort_order ASC, created_at ASC`,
    trackerId,
  );
  return rows.map(mapGoal);
}

/**
 * Enforces the "one target per tracker and period" rule used by the add-goal
 * form. Archiving a goal frees the slot again.
 */
export async function findGoalForPeriod(
  db: SQLiteDatabase,
  trackerId: string,
  period: Period,
  excludeGoalId?: string,
): Promise<Goal | null> {
  const row = await db.getFirstAsync<GoalRow>(
    `SELECT * FROM goals
     WHERE tracker_id = ? AND period = ? AND archived = 0
       AND (? IS NULL OR id <> ?)
     LIMIT 1`,
    trackerId,
    period,
    excludeGoalId ?? null,
    excludeGoalId ?? null,
  );
  return row ? mapGoal(row) : null;
}

export async function createGoal(db: SQLiteDatabase, input: CreateGoalInput): Promise<Goal> {
  const tracker = await getTracker(db, input.trackerId);
  if (!tracker) {
    throw new Error('This tracker no longer exists.');
  }

  const target = tracker.kind === 'check' ? 1 : input.target;
  assertTarget(target);

  const goal: Goal = {
    id: randomUUID(),
    trackerId: input.trackerId,
    period: input.period,
    target,
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

export async function updateGoal(
  db: SQLiteDatabase,
  goalId: string,
  input: UpdateGoalInput,
): Promise<void> {
  const current = await getGoal(db, goalId);
  if (!current) {
    throw new Error('This goal no longer exists.');
  }

  const tracker = await getTracker(db, current.trackerId);
  if (!tracker) {
    throw new Error('This tracker no longer exists.');
  }

  const target = tracker.kind === 'check' ? 1 : (input.target ?? current.target);
  assertTarget(target);

  await db.runAsync(
    `UPDATE goals SET period = ?, target = ?, reminder_time = ? WHERE id = ?`,
    input.period ?? current.period,
    target,
    input.reminderTime === undefined ? current.reminderTime : input.reminderTime,
    goalId,
  );
}

export async function archiveGoal(db: SQLiteDatabase, goalId: string): Promise<void> {
  await db.runAsync('UPDATE goals SET archived = 1 WHERE id = ?', goalId);
}
