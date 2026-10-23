/**
 * Runs with TZ=America/New_York (see the test:dst script) so the period
 * boundaries are exercised on days with 23 and 25 hours.
 */
import { getPeriodRange } from '../period';
import { sumAmounts } from '../progress';

const HOUR = 60 * 60 * 1000;

describe('daylight saving time', () => {
  it('handles the 23-hour spring-forward day', () => {
    const range = getPeriodRange('daily', new Date(2026, 2, 8, 12));
    expect(range.end.getTime() - range.start.getTime()).toBe(23 * HOUR);
  });

  it('handles the 25-hour fall-back day', () => {
    const range = getPeriodRange('daily', new Date(2026, 10, 1, 12));
    expect(range.end.getTime() - range.start.getTime()).toBe(25 * HOUR);
  });

  it('keeps the Monday week at seven calendar days across spring forward', () => {
    const range = getPeriodRange('weekly', new Date(2026, 2, 5, 12));
    expect(range.key).toBe('2026-03-02');
    expect(range.end.getTime() - range.start.getTime()).toBe(167 * HOUR);
  });

  it('still buckets a late-night log on the long day correctly', () => {
    const range = getPeriodRange('daily', new Date(2026, 10, 1, 12));
    const lateLog = { loggedAt: new Date(2026, 10, 1, 23, 30).getTime(), amount: 5 };
    const nextDayLog = { loggedAt: new Date(2026, 10, 2, 0, 30).getTime(), amount: 100 };

    expect(sumAmounts([lateLog, nextDayLog], range)).toBe(5);
  });

  it('rounds the leap day into its month', () => {
    const range = getPeriodRange('monthly', new Date(2028, 1, 29, 12));
    expect(range.key).toBe('2028-02');
    expect(range.end).toEqual(new Date(2028, 2, 1));
  });
});
