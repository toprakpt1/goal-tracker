import {
  formatReminderTime,
  normalizeReminderTime,
  parseReminderTime,
} from '../reminder-time';

describe('parseReminderTime', () => {
  it('parses valid 24-hour times', () => {
    expect(parseReminderTime('07:05')).toEqual({ hour: 7, minute: 5 });
    expect(parseReminderTime(' 23:59 ')).toEqual({ hour: 23, minute: 59 });
    expect(parseReminderTime('0:00')).toEqual({ hour: 0, minute: 0 });
  });

  it('rejects out-of-range or malformed times', () => {
    expect(parseReminderTime('')).toBeNull();
    expect(parseReminderTime('7')).toBeNull();
    expect(parseReminderTime('07:5')).toBeNull();
    expect(parseReminderTime('24:00')).toBeNull();
    expect(parseReminderTime('12:60')).toBeNull();
    expect(parseReminderTime('noon')).toBeNull();
  });
});

describe('normalizeReminderTime', () => {
  it('pads hours and keeps valid minutes', () => {
    expect(normalizeReminderTime('7:05')).toBe('07:05');
    expect(normalizeReminderTime('18:30')).toBe('18:30');
  });

  it('returns null for invalid values', () => {
    expect(normalizeReminderTime('25:00')).toBeNull();
  });
});

describe('formatReminderTime', () => {
  it('always uses two digits', () => {
    expect(formatReminderTime({ hour: 0, minute: 0 })).toBe('00:00');
    expect(formatReminderTime({ hour: 9, minute: 5 })).toBe('09:05');
  });
});
