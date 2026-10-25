import { getPeriodRange } from './period';
import { getGoalActiveRange } from './scope';
import type { Goal, LogEntry, PeriodRange, WeekStartsOn } from './types';

export interface Progress {
  /** Raw sum of log amounts inside the period. */
  total: number;
  target: number;
  /** Growth toward the target, clamped to 0..1. Use this for rings and bars. */
  ratio: number;
  /** Uncapped percentage, so 60/50 renders as 120. */
  percent: number;
  /** How much is still missing, clamped at 0. */
  remaining: number;
  isComplete: boolean;
  /** Amount above the target, clamped at 0. */
  overshoot: number;
}

type AmountLog = Pick<LogEntry, 'amount' | 'loggedAt'>;

/** Rounds to two decimals so float noise (0.1 + 0.2) never reaches the UI. */
export function roundAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sumAmounts(logs: readonly AmountLog[], range: PeriodRange): number {
  const start = range.start.getTime();
  const end = range.end.getTime();

  let total = 0;
  for (const log of logs) {
    if (log.loggedAt >= start && log.loggedAt < end) {
      total += log.amount;
    }
  }
  return roundAmount(total);
}

export function getProgress(
  target: number,
  logs: readonly AmountLog[],
  range: PeriodRange,
): Progress {
  const total = sumAmounts(logs, range);
  const safeTarget = target > 0 ? target : 0;
  const ratio = safeTarget === 0 ? 0 : Math.min(Math.max(total / safeTarget, 0), 1);
  const percent = safeTarget === 0 ? 0 : roundAmount((total / safeTarget) * 100);

  return {
    total,
    target,
    ratio,
    percent,
    remaining: roundAmount(Math.max(safeTarget - total, 0)),
    isComplete: safeTarget > 0 && total >= safeTarget,
    overshoot: roundAmount(Math.max(total - safeTarget, 0)),
  };
}

/** Convenience wrapper for the common "this goal right now" call. */
export function getGoalProgress(
  goal: Pick<Goal, 'target' | 'period'> & {
    scopeStart?: number | null;
    scopeEnd?: number | null;
  },
  logs: readonly AmountLog[],
  date: Date,
  weekStartsOn: WeekStartsOn = 1,
): Progress {
  const range = getGoalActiveRange(
    {
      period: goal.period,
      scopeStart: goal.scopeStart ?? null,
      scopeEnd: goal.scopeEnd ?? null,
    },
    date,
    weekStartsOn,
  );

  if (!range) {
    // Inactive goals should not count logs from a period they do not cover.
    return getProgress(goal.target, [], getPeriodRange(goal.period, date, weekStartsOn));
  }

  return getProgress(goal.target, logs, range);
}
