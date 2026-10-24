import { getPeriodRange, getPreviousPeriodRange } from './period';
import { roundAmount } from './progress';
import type { Period, PeriodRange, WeekStartsOn } from './types';

export interface StreakSummary {
  /** Completed periods ending with the current period or the one before it. */
  current: number;
  /** Longest run of consecutive completed periods in the history. */
  best: number;
  /** Number of completed periods at the current target. */
  total: number;
}

type AmountLog = {
  amount: number;
  loggedAt: number;
};

interface PeriodTotal {
  total: number;
  range: PeriodRange;
}

/**
 * Groups log amounts by the period that contains them. The current target is
 * applied later, so the same totals can power different views.
 */
export function getPeriodTotals(
  logs: readonly AmountLog[],
  period: Period,
  weekStartsOn: WeekStartsOn = 1,
): Map<string, PeriodTotal> {
  const totals = new Map<string, PeriodTotal>();

  for (const log of logs) {
    if (!Number.isFinite(log.amount) || !Number.isFinite(log.loggedAt) || log.amount <= 0) {
      continue;
    }

    const range = getPeriodRange(period, new Date(log.loggedAt), weekStartsOn);
    const existing = totals.get(range.key);
    totals.set(range.key, {
      total: roundAmount((existing?.total ?? 0) + log.amount),
      range: existing?.range ?? range,
    });
  }

  return totals;
}

/**
 * Streaks count periods that reached the current target.
 *
 * A period that has not been completed yet does not break the streak while it
 * is still running: on Friday, a Monday-to-Thursday run is reported as four
 * days, not zero. Once the period ends without completion, the gap breaks it.
 */
export function getStreakSummary(
  period: Period,
  target: number,
  logs: readonly AmountLog[],
  now: Date = new Date(),
  weekStartsOn: WeekStartsOn = 1,
): StreakSummary {
  if (!(target > 0)) {
    return { current: 0, best: 0, total: 0 };
  }

  const completed = [...getPeriodTotals(logs, period, weekStartsOn).values()].filter(
    (entry) => entry.total >= target,
  );

  if (completed.length === 0) {
    return { current: 0, best: 0, total: 0 };
  }

  const completedKeys = new Set(completed.map((entry) => entry.range.key));
  let cursor = getPeriodRange(period, now, weekStartsOn);
  if (!completedKeys.has(cursor.key)) {
    cursor = getPreviousPeriodRange(period, cursor, weekStartsOn);
  }

  let current = 0;
  while (completedKeys.has(cursor.key)) {
    current += 1;
    cursor = getPreviousPeriodRange(period, cursor, weekStartsOn);
  }

  const orderedRanges = completed
    .map((entry) => entry.range)
    .sort((left, right) => left.start.getTime() - right.start.getTime());

  let best = 0;
  let run = 0;
  let previousEnd: number | null = null;

  for (const range of orderedRanges) {
    const continues = previousEnd !== null && range.start.getTime() === previousEnd;
    run = continues ? run + 1 : 1;
    best = Math.max(best, run);
    previousEnd = range.end.getTime();
  }

  return { current, best, total: completed.length };
}
