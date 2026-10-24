export const DATABASE_NAME = 'goaltracker.db';

/**
 * Bump this and add a branch in `migrations.ts` for every schema change.
 * The value is stored in SQLite's `PRAGMA user_version`.
 */
export const SCHEMA_VERSION = 3;

export const SCHEMA_V1 = `
CREATE TABLE trackers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  default_step REAL NOT NULL DEFAULT 1 CHECK (default_step > 0),
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY NOT NULL,
  tracker_id TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  target REAL NOT NULL CHECK (target > 0),
  reminder_time TEXT,
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE logs (
  id TEXT PRIMARY KEY NOT NULL,
  tracker_id TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
  amount REAL NOT NULL CHECK (amount > 0),
  logged_at INTEGER NOT NULL,
  note TEXT
);

-- Remembers which periods were already celebrated. Never rewritten when a log
-- is deleted, so a goal cannot celebrate the same period twice.
CREATE TABLE completions (
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (goal_id, period_key)
);

CREATE INDEX idx_logs_tracker_time ON logs (tracker_id, logged_at);
CREATE INDEX idx_goals_tracker ON goals (tracker_id);
CREATE INDEX idx_goals_active ON goals (archived, period);
CREATE INDEX idx_trackers_active ON trackers (archived, sort_order);
`;

/**
 * v2 replaces emoji icons with Lucide icon names. The renderer also understands
 * the old emoji values, but migrating keeps the data honest for future screens.
 */
export const SCHEMA_V2 = `
UPDATE trackers SET icon = 'book-open' WHERE icon = '📚';
UPDATE trackers SET icon = 'book' WHERE icon = '📖';
UPDATE trackers SET icon = 'droplets' WHERE icon = '💧';
UPDATE trackers SET icon = 'dumbbell' WHERE icon IN ('🏋️', '🏋');
UPDATE trackers SET icon = 'target' WHERE icon IS NULL OR trim(icon) = '';
`;

/**
 * v3 adds checklist trackers. Their goals always have a target of one and are
 * completed by ticking them off; the unit and quick-add step stay unused.
 */
export const SCHEMA_V3 = `
ALTER TABLE trackers ADD COLUMN kind TEXT NOT NULL DEFAULT 'numeric'
  CHECK (kind IN ('numeric', 'check'));
`;
