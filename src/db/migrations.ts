import type { SQLiteDatabase } from 'expo-sqlite';

import { SCHEMA_V1, SCHEMA_VERSION } from './schema';

/**
 * Runs before any screen renders (see the root layout). Schema changes and the
 * user_version bump happen in the same transaction so a crash never leaves a
 * half-migrated database behind.
 */
export async function migrate(db: SQLiteDatabase): Promise<void> {
  // Connection settings must be applied outside the migration transaction.
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion > SCHEMA_VERSION) {
    throw new Error(
      `Database schema v${currentVersion} is newer than this app supports (v${SCHEMA_VERSION}).`,
    );
  }

  if (currentVersion === SCHEMA_VERSION) {
    return;
  }

  await db.withTransactionAsync(async () => {
    if (currentVersion < 1) {
      await db.execAsync(SCHEMA_V1);
    }

    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}
