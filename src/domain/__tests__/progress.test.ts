import { getPeriodRange } from '../period';
import { getGoalProgress, getProgress, roundAmount, sumAmounts } from '../progress';

const day = getPeriodRange('daily', new Date(2026, 9, 23, 12));

const log = (loggedAt: Date, amount = 1) => ({ loggedAt: loggedAt.getTime(), amount });

describe('sumAmounts', () => {
  it('returns zero for an empty period', () => {
    expect(sumAmounts([], day)).toBe(0);
  });

  it('includes the start and excludes the end of the period', () => {
    const start = new Date(2026, 9, 23, 0, 0, 0, 0);
    const end = new Date(2026, 9, 24, 0, 0, 0, 0);
    const lastMoment = new Date(end.getTime() - 1);

    expect(sumAmounts([log(start, 5), log(lastMoment, 7)], day)).toBe(12);
    expect(sumAmounts([log(end, 100)], day)).toBe(0);
    expect(sumAmounts([log(new Date(2026, 9, 22, 23, 59, 59), 100)], day)).toBe(0);
  });

  it('adds fractional units without float noise', () => {
    const total = sumAmounts(
      [log(new Date(2026, 9, 23, 9), 0.1), log(new Date(2026, 9, 23, 10), 0.2)],
      day,
    );
    expect(total).toBe(0.3);
  });
});

describe('getProgress', () => {
  const at = (hour: number, amount: number) => log(new Date(2026, 9, 23, hour), amount);

  it('reports partial progress', () => {
    const progress = getProgress(50, [at(9, 23)], day);

    expect(progress.total).toBe(23);
    expect(progress.percent).toBe(46);
    expect(progress.ratio).toBeCloseTo(0.46);
    expect(progress.remaining).toBe(27);
    expect(progress.isComplete).toBe(false);
    expect(progress.overshoot).toBe(0);
  });

  it('treats exactly reaching the target as complete', () => {
    const progress = getProgress(50, [at(9, 25), at(12, 25)], day);

    expect(progress.total).toBe(50);
    expect(progress.isComplete).toBe(true);
    expect(progress.remaining).toBe(0);
    expect(progress.ratio).toBe(1);
    expect(progress.percent).toBe(100);
  });

  it('allows and reports overshoot', () => {
    const progress = getProgress(50, [at(9, 60)], day);

    expect(progress.total).toBe(60);
    expect(progress.isComplete).toBe(true);
    expect(progress.ratio).toBe(1);
    expect(progress.percent).toBe(120);
    expect(progress.overshoot).toBe(10);
  });

  it('ignores logs outside the period', () => {
    const progress = getProgress(50, [log(new Date(2026, 9, 22, 9), 40), at(9, 10)], day);
    expect(progress.total).toBe(10);
  });

  it('guards against a non-positive target', () => {
    const progress = getProgress(0, [at(9, 10)], day);
    expect(progress.isComplete).toBe(false);
    expect(progress.percent).toBe(0);
    expect(progress.ratio).toBe(0);
  });

  it('completes a checklist goal with a single tick', () => {
    const progress = getProgress(1, [at(9, 1)], day);

    expect(progress.total).toBe(1);
    expect(progress.isComplete).toBe(true);
    expect(progress.ratio).toBe(1);
    expect(progress.percent).toBe(100);
    expect(progress.overshoot).toBe(0);
  });
});

describe('getGoalProgress', () => {
  const logs = [
    log(new Date(2026, 9, 19, 9), 40),
    log(new Date(2026, 9, 23, 9), 23),
  ];

  it('uses the goal period', () => {
    const daily = getGoalProgress({ target: 50, period: 'daily' }, logs, new Date(2026, 9, 23, 12));
    expect(daily.total).toBe(23);

    const weekly = getGoalProgress(
      { target: 350, period: 'weekly' },
      logs,
      new Date(2026, 9, 23, 12),
    );
    expect(weekly.total).toBe(63);
  });
});

describe('roundAmount', () => {
  it('rounds to two decimals', () => {
    expect(roundAmount(1.005)).toBe(1.01);
    expect(roundAmount(0.1 + 0.2)).toBe(0.3);
  });
});
