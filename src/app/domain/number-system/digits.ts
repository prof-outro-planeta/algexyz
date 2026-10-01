export const MIN_BASE = 2;
export const MAX_BASE = 36;

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function isValidBase(base: number): boolean {
  return Number.isInteger(base) && base >= MIN_BASE && base <= MAX_BASE;
}

export function assertValidBase(base: number): void {
  if (!isValidBase(base)) {
    throw new RangeError(`Base must be an integer between ${MIN_BASE} and ${MAX_BASE}, got ${base}`);
  }
}

export function digitsForBase(base: number): string {
  assertValidBase(base);
  return DIGITS.slice(0, base);
}

export function normalizeNumeral(numeral: string): string {
  return numeral.trim().toUpperCase();
}

export function digitValue(char: string): number {
  return DIGITS.indexOf(char.toUpperCase());
}

export function digitChar(value: number): string {
  return DIGITS[value];
}

export function invalidDigits(numeral: string, base: number): string[] {
  assertValidBase(base);
  const normalized = normalizeNumeral(numeral);
  const digits = normalized.startsWith('-') ? normalized.slice(1) : normalized;
  const invalid = [...digits].filter((char) => {
    const value = digitValue(char);
    return value < 0 || value >= base;
  });
  return [...new Set(invalid)];
}

export function isValidNumeral(numeral: string, base: number): boolean {
  assertValidBase(base);
  const normalized = normalizeNumeral(numeral);
  const digits = normalized.startsWith('-') ? normalized.slice(1) : normalized;
  if (digits.length === 0) {
    return false;
  }
  return [...digits].every((char) => {
    const value = digitValue(char);
    return value >= 0 && value < base;
  });
}
