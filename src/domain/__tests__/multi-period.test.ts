import { getGoalProgress } from '../progress';

/**
 * The milestone-2 acceptance case, expressed as pure data: one tracker, four
 * goals with different periods, and one shared log stream.
 */
describe('one log stream feeds every period', () => {
  const now = new Date(2026, 9, 23, 12); // Friday 23 Oct 2026

  const pages = [
    { loggedAt: new Date(2026, 9, 23, 8).getTime(), amount: 23 }, // today
    { loggedAt: new Date(2026, 9, 22, 20).getTime(), amount: 50 }, // Thursday
    { loggedAt: new Date(2026, 9, 20, 18).getTime(), amount: 40 }, // Tuesday
    { loggedAt: new Date(2026, 9, 14, 7).getTime(), amount: 60 }, // earlier in October
    { loggedAt: new Date(2026, 8, 13, 7).getTime(), amount: 55 }, // September
  ];

  it('computes daily, weekly, monthly and yearly progress from the same logs', () => {
    expect(getGoalProgress({ target: 50, period: 'daily' }, pages, now).total).toBe(23);
    expect(getGoalProgress({ target: 350, period: 'weekly' }, pages, now).total).toBe(113);
    expect(getGoalProgress({ target: 1000, period: 'monthly' }, pages, now).total).toBe(173);
    expect(getGoalProgress({ target: 12000, period: 'yearly' }, pages, now).total).toBe(228);
  });

  it('marks only the periods that reached their target as complete', () => {
    expect(getGoalProgress({ target: 20, period: 'daily' }, pages, now).isComplete).toBe(true);
    expect(getGoalProgress({ target: 50, period: 'daily' }, pages, now).isComplete).toBe(false);
    expect(getGoalProgress({ target: 110, period: 'weekly' }, pages, now).isComplete).toBe(true);
  });

  it('recomputes when a log is deleted', () => {
    const withoutToday = pages.slice(1);
    expect(getGoalProgress({ target: 50, period: 'daily' }, withoutToday, now).total).toBe(0);
    expect(getGoalProgress({ target: 350, period: 'weekly' }, withoutToday, now).total).toBe(90);
  });
});
