import {
  addDays,
  addMonths,
  addYears,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

import type { Period, PeriodRange, WeekStartsOn } from './types';

export const DEFAULT_WEEK_STARTS_ON: WeekStartsOn = 1;

/**
 * The current period window containing `date`, in the device's local time.
 *
 * The `key` is always the local start date of the period. Using the start date
 * (instead of an ISO week number) keeps keys stable across year boundaries and
 * across changes to the week-start setting.
 *
 * `end` is exclusive.
 */
export function getPeriodRange(
  period: Period,
  date: Date = new Date(),
  weekStartsOn: WeekStartsOn = DEFAULT_WEEK_STARTS_ON,
): PeriodRange {
  switch (period) {
    case 'daily': {
      const start = startOfDay(date);
      return { start, end: addDays(start, 1), key: format(start, 'yyyy-MM-dd') };
    }
    case 'weekly': {
      const start = startOfWeek(date, { weekStartsOn });
      return { start, end: addDays(start, 7), key: format(start, 'yyyy-MM-dd') };
    }
    case 'monthly': {
      const start = startOfMonth(date);
      return { start, end: addMonths(start, 1), key: format(start, 'yyyy-MM') };
    }
    case 'yearly': {
      const start = startOfYear(date);
      return { start, end: addYears(start, 1), key: format(start, 'yyyy') };
    }
  }
}

/**
 * The period immediately before `range`. Used by streak/history calculations.
 */
export function getPreviousPeriodRange(
  period: Period,
  range: PeriodRange,
  weekStartsOn: WeekStartsOn = DEFAULT_WEEK_STARTS_ON,
): PeriodRange {
  return getPeriodRange(period, new Date(range.start.getTime() - 1), weekStartsOn);
}

/**
 * The period immediately after `range`.
 */
export function getNextPeriodRange(
  period: Period,
  range: PeriodRange,
  weekStartsOn: WeekStartsOn = DEFAULT_WEEK_STARTS_ON,
): PeriodRange {
  return getPeriodRange(period, range.end, weekStartsOn);
}

/**
 * Returns the last `count` periods ending with the period containing `date`,
 * oldest first. Handy for charts in a later milestone.
 */
export function getRecentPeriods(
  period: Period,
  date: Date,
  count: number,
  weekStartsOn: WeekStartsOn = DEFAULT_WEEK_STARTS_ON,
): PeriodRange[] {
  if (count <= 0) {
    return [];
  }

  const ranges: PeriodRange[] = [getPeriodRange(period, date, weekStartsOn)];
  while (ranges.length < count) {
    const last = ranges[0];
    ranges.unshift(getPreviousPeriodRange(period, last, weekStartsOn));
  }
  return ranges;
}
