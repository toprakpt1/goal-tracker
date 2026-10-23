/**
 * Parses a user-typed amount. Accepts both `12.5` and `12,5` and returns null
 * for empty, zero, negative or non-numeric input.
 */
export function parseAmount(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
}
