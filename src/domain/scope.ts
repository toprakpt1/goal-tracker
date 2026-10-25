import { format } from 'date-fns';

import { getPeriodRange } from './period';
import type { Goal, Period, PeriodRange, WeekStartsOn } from './types';

/**
 * The scheduling part of a goal. Kept separate from `Goal` so the pure helpers
 * can also be used while a goal is still being edited.
 */
export type GoalScope = Pick<Goal, 'period'> & {
  scopeStart: number | null;
  scopeEnd: number | null;
};

/** A goal without a scope applies to every occurrence of its period. */
export function isRecurringGoal(goal: GoalScope): boolean {
  return goal.scopeStart == null || goal.scopeEnd == null;
}

/**
 * The goal's own window. Scoped goals are stored as a single period range, so
 * the label and the detail screen can use the stored bounds directly.
 */
export function getGoalScopeRange(
  goal: GoalScope,
  weekStartsOn: WeekStartsOn = 1,
): PeriodRange | null {
  if (isRecurringGoal(goal)) {
    return null;
  }

  const start = new Date(goal.scopeStart as number);
  return {
    start,
    end: new Date(goal.scopeEnd as number),
    key: getPeriodRange(goal.period, start, weekStartsOn).key,
  };
}

/**
 * The period range a goal is measured against on `date`, intersected with its
 * scope. Returns null when the goal is not active on that date.
 */
export function getGoalActiveRange(
  goal: GoalScope,
  date: Date,
  weekStartsOn: WeekStartsOn = 1,
): PeriodRange | null {
  const base = getPeriodRange(goal.period, date, weekStartsOn);

  if (isRecurringGoal(goal)) {
    return base;
  }

  const start = Math.max(base.start.getTime(), goal.scopeStart as number);
  const end = Math.min(base.end.getTime(), goal.scopeEnd as number);
  if (start >= end) {
    return null;
  }

  return { start: new Date(start), end: new Date(end), key: base.key };
}

/** True when the goal's scope overlaps an already computed period range. */
export function isGoalActiveInRange(goal: GoalScope, range: PeriodRange): boolean {
  if (isRecurringGoal(goal)) {
    return true;
  }

  return (
    (goal.scopeStart as number) < range.end.getTime() &&
    (goal.scopeEnd as number) > range.start.getTime()
  );
}

export function isGoalActiveAt(
  goal: GoalScope,
  date: Date,
  weekStartsOn: WeekStartsOn = 1,
): boolean {
  return getGoalActiveRange(goal, date, weekStartsOn) !== null;
}

/** Builds the scope stored on a goal created for the period containing `date`. */
export function getScopeForDate(
  period: Period,
  date: Date,
  weekStartsOn: WeekStartsOn = 1,
): { scopeStart: number; scopeEnd: number } {
  const range = getPeriodRange(period, date, weekStartsOn);
  return { scopeStart: range.start.getTime(), scopeEnd: range.end.getTime() };
}

export function formatPeriodRange(period: Period, range: PeriodRange): string {
  switch (period) {
    case 'daily':
      return format(range.start, 'd MMM yyyy');
    case 'weekly': {
      const last = new Date(range.end.getTime() - 1);
      return `${format(range.start, 'd MMM')} – ${format(last, 'd MMM yyyy')}`;
    }
    case 'monthly':
      return format(range.start, 'MMMM yyyy');
    case 'yearly':
      return format(range.start, 'yyyy');
  }
}

/** Human label for a scoped goal, or null when it repeats every period. */
export function getGoalScopeLabel(
  goal: GoalScope,
  weekStartsOn: WeekStartsOn = 1,
): string | null {
  const range = getGoalScopeRange(goal, weekStartsOn);
  return range ? formatPeriodRange(goal.period, range) : null;
}
