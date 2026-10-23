import {
  getNextPeriodRange,
  getPeriodRange,
  getPreviousPeriodRange,
  getRecentPeriods,
} from '../period';

const friday = new Date(2026, 9, 23, 14, 30, 0, 0); // Friday 23 Oct 2026, local time

describe('getPeriodRange', () => {
  it('returns the current local day for daily', () => {
    const range = getPeriodRange('daily', friday);
    expect(range.start).toEqual(new Date(2026, 9, 23));
    expect(range.end).toEqual(new Date(2026, 9, 24));
    expect(range.key).toBe('2026-10-23');
  });

  it('starts weeks on Monday by default', () => {
    const range = getPeriodRange('weekly', friday);
    expect(range.start).toEqual(new Date(2026, 9, 19));
    expect(range.end).toEqual(new Date(2026, 9, 26));
    expect(range.key).toBe('2026-10-19');
  });

  it('keeps Sunday in the week that started on Monday', () => {
    const sunday = new Date(2026, 9, 25, 23, 59);
    const range = getPeriodRange('weekly', sunday);
    expect(range.key).toBe('2026-10-19');
  });

  it('handles a week that crosses the new year', () => {
    const range = getPeriodRange('weekly', new Date(2026, 11, 30, 12));
    expect(range.start).toEqual(new Date(2026, 11, 28));
    expect(range.end).toEqual(new Date(2027, 0, 4));
    expect(range.key).toBe('2026-12-28');
  });

  it('handles the first day of a new year', () => {
    const range = getPeriodRange('daily', new Date(2027, 0, 1, 0, 5));
    expect(range.key).toBe('2027-01-01');
    expect(range.start).toEqual(new Date(2027, 0, 1));
  });

  it('returns the whole month and clamps month end', () => {
    const range = getPeriodRange('monthly', new Date(2026, 0, 31, 23, 59));
    expect(range.start).toEqual(new Date(2026, 0, 1));
    expect(range.end).toEqual(new Date(2026, 1, 1));
    expect(range.key).toBe('2026-01');
  });

  it('handles February in a leap year', () => {
    const range = getPeriodRange('monthly', new Date(2028, 1, 29, 8));
    expect(range.start).toEqual(new Date(2028, 1, 1));
    expect(range.end).toEqual(new Date(2028, 2, 1));
  });

  it('returns the whole year for yearly', () => {
    const range = getPeriodRange('yearly', friday);
    expect(range.start).toEqual(new Date(2026, 0, 1));
    expect(range.end).toEqual(new Date(2027, 0, 1));
    expect(range.key).toBe('2026');
  });

  it('supports a different week start without changing the key format', () => {
    const sunday = new Date(2026, 9, 25, 12);
    const range = getPeriodRange('weekly', sunday, 0);
    expect(range.start).toEqual(new Date(2026, 9, 25));
    expect(range.key).toBe('2026-10-25');
  });
});

describe('getPreviousPeriodRange and getNextPeriodRange', () => {
  it('walks backwards across a month boundary', () => {
    const range = getPeriodRange('daily', new Date(2026, 9, 1, 9));
    const previous = getPreviousPeriodRange('daily', range);
    expect(previous.key).toBe('2026-09-30');

    const next = getNextPeriodRange('daily', previous);
    expect(next.key).toBe('2026-10-01');
  });

  it('walks backwards across a year boundary', () => {
    const range = getPeriodRange('weekly', new Date(2027, 0, 6));
    expect(range.key).toBe('2027-01-04');

    const previous = getPreviousPeriodRange('weekly', range);
    expect(previous.key).toBe('2026-12-28');
  });
});

describe('getRecentPeriods', () => {
  it('returns periods oldest first, ending with the current one', () => {
    const ranges = getRecentPeriods('daily', friday, 3);
    expect(ranges.map((range) => range.key)).toEqual(['2026-10-21', '2026-10-22', '2026-10-23']);
  });

  it('returns an empty list when count is zero', () => {
    expect(getRecentPeriods('daily', friday, 0)).toEqual([]);
  });
});
