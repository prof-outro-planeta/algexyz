import {
  assertValidBase,
  digitChar,
  digitValue,
  isValidNumeral,
  normalizeNumeral,
} from '../number-system';

export function parseNumeral(numeral: string, base: number): bigint {
  if (!isValidNumeral(numeral, base)) {
    throw new RangeError(`"${numeral}" is not a valid base-${base} numeral`);
  }
  const normalized = normalizeNumeral(numeral);
  const negative = normalized.startsWith('-');
  const digits = negative ? normalized.slice(1) : normalized;
  const bigBase = BigInt(base);

  let value = 0n;
  for (const char of digits) {
    value = value * bigBase + BigInt(digitValue(char));
  }
  return negative ? -value : value;
}

export function formatNumeral(value: bigint, base: number): string {
  assertValidBase(base);
  if (value === 0n) {
    return '0';
  }
  const negative = value < 0n;
  const bigBase = BigInt(base);

  let remaining = negative ? -value : value;
  let result = '';
  while (remaining > 0n) {
    result = digitChar(Number(remaining % bigBase)) + result;
    remaining /= bigBase;
  }
  return negative ? `-${result}` : result;
}

export function convert(numeral: string, fromBase: number, toBase: number): string {
  return formatNumeral(parseNumeral(numeral, fromBase), toBase);
}
