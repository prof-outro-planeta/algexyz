import { assertValidBase, digitChar, isValidNumeral, normalizeNumeral } from '../number-system';
import { DivisionStep, ExplanationStrategy, RepeatedDivisionExplanation } from './explanation';

const FROM_BASE = 10;

export function explainRepeatedDivision(numeral: string, toBase: number): RepeatedDivisionExplanation {
  assertValidBase(toBase);
  if (!isValidNumeral(numeral, FROM_BASE)) {
    throw new RangeError(`"${numeral}" is not a valid base-${FROM_BASE} numeral`);
  }
  const normalized = normalizeNumeral(numeral);
  const negative = normalized.startsWith('-');
  const magnitude = BigInt(negative ? normalized.slice(1) : normalized);

  const base = BigInt(toBase);
  const steps: DivisionStep[] = [];
  let dividend = magnitude;
  do {
    const quotient = dividend / base;
    const remainder = Number(dividend % base);
    steps.push({ dividend, quotient, remainder, digit: digitChar(remainder) });
    dividend = quotient;
  } while (dividend > 0n);

  const digits = steps
    .map((step) => step.digit)
    .reverse()
    .join('');
  const signed = negative && magnitude !== 0n;

  return {
    strategy: 'repeated-division',
    input: { numeral: normalized, base: FROM_BASE },
    output: { numeral: signed ? `-${digits}` : digits, base: toBase },
    negative: signed,
    steps,
  };
}

export const repeatedDivisionStrategy: ExplanationStrategy = {
  supports: (fromBase, toBase) => fromBase === FROM_BASE && toBase !== FROM_BASE,
  explain: (numeral, _fromBase, toBase) => explainRepeatedDivision(numeral, toBase),
};
