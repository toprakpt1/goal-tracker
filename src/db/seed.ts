import type { SQLiteDatabase } from 'expo-sqlite';
import { addDays, addHours, startOfDay } from 'date-fns';

import { trackerPalette } from '@/theme';

import { createGoal } from './repositories/goals';
import { createLog } from './repositories/logs';
import { countTrackers, createTracker } from './repositories/trackers';

export interface SeedResult {
  created: boolean;
}

/** A local timestamp `daysAgo` days back at `hour`, never in the future. */
function at(daysAgo: number, hour: number, now: Date): number {
  const day = startOfDay(addDays(now, -daysAgo));
  return Math.min(addHours(day, hour).getTime(), now.getTime());
}

/**
 * Seeds the example trackers from the product brief. Only runs on an empty
 * database so it can never mix demo data into a real user's history.
 */
export async function seedDemoData(db: SQLiteDatabase, now: Date = new Date()): Promise<SeedResult> {
  if ((await countTrackers(db)) > 0) {
    return { created: false };
  }

  await db.withTransactionAsync(async () => {
    const reading = await createTracker(db, {
      name: 'Reading',
      unit: 'pages',
      icon: 'book-open',
      color: trackerPalette[0],
      defaultStep: 10,
      sortOrder: 0,
    });

    const books = await createTracker(db, {
      name: 'Books finished',
      unit: 'books',
      icon: 'book',
      color: trackerPalette[4],
      defaultStep: 1,
      sortOrder: 1,
    });

    const water = await createTracker(db, {
      name: 'Water',
      unit: 'L',
      icon: 'droplets',
      color: trackerPalette[1],
      defaultStep: 0.5,
      sortOrder: 2,
    });

    const workout = await createTracker(db, {
      name: 'Workout',
      unit: 'times',
      icon: 'dumbbell',
      color: trackerPalette[3],
      defaultStep: 1,
      sortOrder: 3,
    });

    await createGoal(db, { trackerId: reading.id, period: 'daily', target: 50, sortOrder: 0 });
    await createGoal(db, { trackerId: reading.id, period: 'weekly', target: 350, sortOrder: 1 });
    await createGoal(db, { trackerId: reading.id, period: 'monthly', target: 1000, sortOrder: 2 });
    await createGoal(db, { trackerId: reading.id, period: 'yearly', target: 12000, sortOrder: 3 });

    await createGoal(db, { trackerId: books.id, period: 'monthly', target: 2, sortOrder: 0 });
    await createGoal(db, { trackerId: books.id, period: 'yearly', target: 24, sortOrder: 1 });

    await createGoal(db, { trackerId: water.id, period: 'daily', target: 2, sortOrder: 0 });

    await createGoal(db, { trackerId: workout.id, period: 'weekly', target: 4, sortOrder: 0 });

    const readingLogs: [number, number][] = [
      [0, 23],
      [1, 50],
      [3, 40],
      [9, 60],
      [40, 55],
    ];
    for (const [daysAgo, amount] of readingLogs) {
      await createLog(db, { trackerId: reading.id, amount, loggedAt: at(daysAgo, 8, now) });
    }

    await createLog(db, { trackerId: books.id, amount: 1, loggedAt: at(2, 20, now) });
    await createLog(db, { trackerId: water.id, amount: 1, loggedAt: at(0, 7, now) });
    await createLog(db, { trackerId: water.id, amount: 2, loggedAt: at(1, 9, now) });
    await createLog(db, { trackerId: workout.id, amount: 1, loggedAt: at(1, 18, now) });
    await createLog(db, { trackerId: workout.id, amount: 1, loggedAt: at(4, 18, now) });
  });

  return { created: true };
}

/** Deletes all user data. Settings are intentionally kept. */
export async function deleteAllData(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM completions; DELETE FROM logs; DELETE FROM goals; DELETE FROM trackers;');
  });
}
