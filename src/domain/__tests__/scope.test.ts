import { getGoalProgress } from '../progress';
import {
  formatPeriodRange,
  getGoalActiveRange,
  getGoalScopeLabel,
  getScopeForDate,
  isGoalActiveAt,
  isGoalActiveInRange,
  isRecurringGoal,
} from '../scope';
import { getPeriodRange } from '../period';

const wednesday = new Date(2026, 10, 4, 12); // Wednesday 4 Nov 2026

const scoped = (period: 'daily' | 'weekly' | 'monthly' | 'yearly', date: Date) => ({
  period,
  ...getScopeForDate(period, date),
});

describe('isRecurringGoal', () => {
  it('treats a goal without a scope as recurring', () => {
    expect(isRecurringGoal({ period: 'weekly', scopeStart: null, scopeEnd: null })).toBe(true);
  });

  it('treats a goal with both bounds as scoped', () => {
    expect(
      isRecurringGoal({
        period: 'weekly',
        scopeStart: new Date(2026, 10, 2).getTime(),
        scopeEnd: new Date(2026, 10, 9).getTime(),
      }),
    ).toBe(false);
  });
});

describe('getScopeForDate', () => {
  it('stores the day containing the date', () => {
    const scope = getScopeForDate('daily', new Date(2026, 10, 5, 18));
    expect(scope.scopeStart).toBe(new Date(2026, 10, 5).getTime());
    expect(scope.scopeEnd).toBe(new Date(2026, 10, 6).getTime());
  });

  it('stores the whole week containing the date', () => {
    const scope = getScopeForDate('weekly', wednesday);
    expect(scope.scopeStart).toBe(new Date(2026, 10, 2).getTime());
    expect(scope.scopeEnd).toBe(new Date(2026, 10, 9).getTime());
  });

  it('respects a Sunday week start', () => {
    const scope = getScopeForDate('weekly', wednesday, 0);
    expect(scope.scopeStart).toBe(new Date(2026, 10, 1).getTime());
    expect(scope.scopeEnd).toBe(new Date(2026, 10, 8).getTime());
  });

  it('stores the month and the year containing the date', () => {
    const month = getScopeForDate('monthly', wednesday);
    expect(month.scopeStart).toBe(new Date(2026, 10, 1).getTime());
    expect(month.scopeEnd).toBe(new Date(2026, 11, 1).getTime());

    const year = getScopeForDate('yearly', wednesday);
    expect(year.scopeStart).toBe(new Date(2026, 0, 1).getTime());
    expect(year.scopeEnd).toBe(new Date(2027, 0, 1).getTime());
  });
});

describe('goal activation', () => {
  const week = scoped('weekly', wednesday);

  it('is active inside its own period', () => {
    expect(isGoalActiveAt(week, wednesday)).toBe(true);
  });

  it('is not active before or after the scoped week', () => {
    expect(isGoalActiveAt(week, new Date(2026, 9, 28, 12))).toBe(false);
    expect(isGoalActiveAt(week, new Date(2026, 10, 11, 12))).toBe(false);
  });

  it('keeps recurring goals active on any date', () => {
    const recurring = { period: 'weekly' as const, scopeStart: null, scopeEnd: null };
    expect(isGoalActiveAt(recurring, new Date(2030, 0, 1))).toBe(true);
  });

  it('intersects the current period with a partial scope', () => {
    const start = new Date(2026, 10, 4).getTime();
    const end = new Date(2026, 10, 6).getTime();
    const partial = { period: 'weekly' as const, scopeStart: start, scopeEnd: end };
    const range = getGoalActiveRange(partial, wednesday);

    expect(range?.start).toEqual(new Date(2026, 10, 4));
    expect(range?.end).toEqual(new Date(2026, 10, 6));
    expect(range?.key).toBe('2026-11-02');
  });

  it('detects overlap with a period range', () => {
    const currentWeek = getPeriodRange('weekly', wednesday);
    expect(isGoalActiveInRange(week, currentWeek)).toBe(true);

    const nextWeek = getPeriodRange('weekly', new Date(2026, 10, 11));
    expect(isGoalActiveInRange(week, nextWeek)).toBe(false);
  });
});

describe('scope labels', () => {
  it('formats each period', () => {
    expect(getGoalScopeLabel(scoped('daily', new Date(2026, 10, 5)))).toBe('5 Nov 2026');
    expect(getGoalScopeLabel(scoped('weekly', wednesday))).toBe('2 Nov – 8 Nov 2026');
    expect(getGoalScopeLabel(scoped('monthly', wednesday))).toBe('November 2026');
    expect(getGoalScopeLabel(scoped('yearly', wednesday))).toBe('2026');
  });

  it('returns null for recurring goals', () => {
    expect(
      getGoalScopeLabel({ period: 'weekly', scopeStart: null, scopeEnd: null }),
    ).toBeNull();
  });

  it('formats a raw period range', () => {
    expect(formatPeriodRange('daily', getPeriodRange('daily', wednesday))).toBe('4 Nov 2026');
  });
});

describe('getGoalProgress with a scope', () => {
  const logs = [
    { loggedAt: new Date(2026, 10, 3, 9).getTime(), amount: 40 },
    { loggedAt: new Date(2026, 10, 4, 9).getTime(), amount: 10 },
    { loggedAt: new Date(2026, 10, 10, 9).getTime(), amount: 25 },
  ];

  it('counts only logs inside the scoped week', () => {
    const progress = getGoalProgress(
      { target: 50, ...scoped('weekly', wednesday) },
      logs,
      wednesday,
    );

    expect(progress.total).toBe(50);
    expect(progress.isComplete).toBe(true);
  });

  it('reports no progress when the goal is not active for the date', () => {
    const progress = getGoalProgress(
      { target: 50, ...scoped('weekly', wednesday) },
      logs,
      new Date(2026, 10, 11, 12),
    );

    expect(progress.total).toBe(0);
    expect(progress.isComplete).toBe(false);
  });
});
