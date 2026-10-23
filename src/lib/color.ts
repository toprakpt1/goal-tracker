/** Adds an alpha channel to a 6-digit hex color. Falls back to the input. */
export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return hex;
  }

  const clamped = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
  return `#${normalized}${clamped.toString(16).padStart(2, '0')}`;
}
