import { parseAmount } from '../numbers';

describe('parseAmount', () => {
  it('parses whole and decimal amounts', () => {
    expect(parseAmount('10')).toBe(10);
    expect(parseAmount('0.5')).toBe(0.5);
    expect(parseAmount(' 12.25 ')).toBe(12.25);
  });

  it('accepts a comma as the decimal separator', () => {
    expect(parseAmount('2,5')).toBe(2.5);
  });

  it('rounds float noise to two decimals', () => {
    expect(parseAmount('0.1')).toBe(0.1);
    expect(parseAmount('1.005')).toBe(1.01);
  });

  it('rejects empty, zero, negative and non-numeric input', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('   ')).toBeNull();
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('-2')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('1.2.3')).toBeNull();
  });
});
