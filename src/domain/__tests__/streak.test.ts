import { getPeriodTotals, getStreakSummary } from '../streak';

const now = new Date(2026, 9, 23, 12, 0, 0, 0); // Friday 23 Oct 2026, local time

function logAt(year: number, month: number, day: number, amount = 1, hour = 9) {
  return { loggedAt: new Date(year, month, day, hour).getTime(), amount };
}

describe('getPeriodTotals', () => {
  it('groups amounts into daily periods', () => {
    const totals = getPeriodTotals(
      [logAt(2026, 9, 22, 2), logAt(2026, 9, 23, 3), logAt(2026, 9, 23, 4)],
      'daily',
    );

    expect(totals.get('2026-10-22')?.total).toBe(2);
    expect(totals.get('2026-10-23')?.total).toBe(7);
  });

  it('rounds fractional amounts so float noise cannot break a target', () => {
    const totals = getPeriodTotals(
      [logAt(2026, 9, 23, 0.1), logAt(2026, 9, 23, 0.2)],
      'daily',
    );

    expect(totals.get('2026-10-23')?.total).toBe(0.3);
  });

  it('ignores zero, negative, and invalid amounts', () => {
    const totals = getPeriodTotals(
      [
        logAt(2026, 9, 23, 0),
        logAt(2026, 9, 23, -3),
        { loggedAt: Number.NaN, amount: 5 },
        logAt(2026, 9, 23, 1),
      ],
      'daily',
    );

    expect(totals.size).toBe(1);
    expect(totals.get('2026-10-23')?.total).toBe(1);
  });
});

describe('getStreakSummary daily', () => {
  it('counts a run that includes the current period', () => {
    const summary = getStreakSummary('daily', 1, [
      logAt(2026, 9, 21),
      logAt(2026, 9, 22),
      logAt(2026, 9, 23),
    ], now);

    expect(summary).toEqual({ current: 3, best: 3, total: 3 });
  });

  it('keeps the streak alive while the current period is still running', () => {
    const summary = getStreakSummary('daily', 1, [
      logAt(2026, 9, 21),
      logAt(2026, 9, 22),
      logAt(2026, 9, 23, 0.5),
    ], now);

    expect(summary.current).toBe(2);
    expect(summary.best).toBe(2);
    expect(summary.total).toBe(2);
  });

  it('breaks the current streak on a missed period', () => {
    const summary = getStreakSummary('daily', 1, [
      logAt(2026, 9, 18),
      logAt(2026, 9, 19),
      logAt(2026, 9, 20),
      logAt(2026, 9, 22), // 21st is missing, 23rd is still running
    ], now);

    expect(summary.current).toBe(1);
    expect(summary.best).toBe(3);
    expect(summary.total).toBe(4);
  });

  it('returns zero when there is no completed period', () => {
    const summary = getStreakSummary('daily', 5, [logAt(2026, 9, 23, 4)], now);
    expect(summary).toEqual({ current: 0, best: 0, total: 0 });
  });

  it('respects fractional targets', () => {
    const summary = getStreakSummary('daily', 2, [
      logAt(2026, 9, 22, 0.5),
      logAt(2026, 9, 22, 0.5),
      logAt(2026, 9, 22, 1),
      logAt(2026, 9, 23, 1.5),
    ], now);

    expect(summary.current).toBe(1);
    expect(summary.best).toBe(1);
  });

  it('returns zeros for an invalid target', () => {
    expect(getStreakSummary('daily', 0, [logAt(2026, 9, 23)], now)).toEqual({
      current: 0,
      best: 0,
      total: 0,
    });
    expect(getStreakSummary('daily', Number.NaN, [logAt(2026, 9, 23)], now)).toEqual({
      current: 0,
      best: 0,
      total: 0,
    });
  });
});

describe('getStreakSummary weekly', () => {
  it('walks Monday-start weeks and ignores the running current week', () => {
    // Current week starts 19 Oct. The two previous weeks are complete.
    const summary = getStreakSummary('weekly', 1, [
      logAt(2026, 9, 5),
      logAt(2026, 9, 12),
      logAt(2026, 9, 20, 0.5),
    ], now);

    expect(summary.current).toBe(2);
    expect(summary.best).toBe(2);
  });

  it('supports a Sunday week start', () => {
    // With Sunday start, 18 Oct opens a new week; with Monday start both logs
    // would belong to the same week and only one would count.
    const summary = getStreakSummary(
      'weekly',
      1,
      [logAt(2026, 9, 12), logAt(2026, 9, 18)],
      now,
      0,
    );

    expect(summary.current).toBe(2);
  });
});

describe('getStreakSummary monthly and yearly', () => {
  it('counts consecutive months, skipping the running month', () => {
    const summary = getStreakSummary('monthly', 1, [
      logAt(2026, 6, 10),
      logAt(2026, 7, 10),
      logAt(2026, 8, 10),
      logAt(2026, 9, 10, 0.5),
    ], now);

    expect(summary.current).toBe(3);
    expect(summary.best).toBe(3);
    expect(summary.total).toBe(3);
  });

  it('crosses the new year for monthly streaks', () => {
    const january = new Date(2027, 0, 15, 12);
    const summary = getStreakSummary('monthly', 1, [
      logAt(2026, 9, 10),
      logAt(2026, 10, 10),
      logAt(2026, 11, 10),
    ], january);

    expect(summary.current).toBe(3);
  });

  it('counts consecutive years and ignores the running year', () => {
    const summary = getStreakSummary('yearly', 1, [
      logAt(2023, 5, 1),
      logAt(2024, 5, 1),
      logAt(2025, 5, 1),
      logAt(2026, 5, 1, 0.5),
    ], now);

    expect(summary.current).toBe(3);
    expect(summary.best).toBe(3);
  });
});
