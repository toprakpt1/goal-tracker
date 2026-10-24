export interface ReminderTime {
  hour: number;
  minute: number;
}

/** Parses a 24-hour `HH:mm` string. Returns null for anything else. */
export function parseReminderTime(value: string): ReminderTime | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

/** Normalizes a valid reminder time to `HH:mm`, or returns null. */
export function normalizeReminderTime(value: string): string | null {
  const parsed = parseReminderTime(value);
  return parsed ? formatReminderTime(parsed) : null;
}

export function formatReminderTime({ hour, minute }: ReminderTime): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
