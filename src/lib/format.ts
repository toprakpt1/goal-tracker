import { format } from 'date-fns';

import { strings } from '@/i18n/strings';

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function formatAmount(value: number): string {
  return numberFormatter.format(value);
}

export function formatDateHeading(date: Date): string {
  return format(date, 'EEE · d MMM');
}

export function formatProgressLine(total: number, target: number, unit: string): string {
  return strings.today.progress(formatAmount(total), formatAmount(target), unit);
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) {
    return strings.greeting.morning;
  }
  if (hour < 18) {
    return strings.greeting.afternoon;
  }
  return strings.greeting.evening;
}
