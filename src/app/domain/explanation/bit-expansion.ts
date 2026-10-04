import { digitValue, isValidNumeral, normalizeNumeral } from '../number-system';
import { bitsPerDigit } from './bit-grouping';
import { BitExpansionExplanation, DigitBits, ExplanationStrategy } from './explanation';

const TO_BASE = 2;

export function explainBitExpansion(numeral: string, fromBase: number): BitExpansionExplanation {
  const groupSize = bitsPerDigit(fromBase);
  if (groupSize === undefined) {
    throw new RangeError(`Bit expansion does not support base ${fromBase}`);
  }
  if (!isValidNumeral(numeral, fromBase)) {
    throw new RangeError(`"${numeral}" is not a valid base-${fromBase} numeral`);
  }
  const normalized = normalizeNumeral(numeral);
  const negative = normalized.startsWith('-');
  const chars = (negative ? normalized.slice(1) : normalized).replace(/^0+(?=.)/, '');

  const digits: DigitBits[] = [...chars].map((digit) => {
    const value = digitValue(digit);
    return { digit, value, bits: value.toString(TO_BASE).padStart(groupSize, '0') };
  });

  const joined = digits.map((d) => d.bits).join('');
  const bits = joined.replace(/^0+(?=.)/, '');
  const signed = negative && bits !== '0' ? `-${bits}` : bits;

  return {
    strategy: 'bit-expansion',
    input: { numeral: normalized, base: fromBase },
    output: { numeral: signed, base: TO_BASE },
    groupSize,
    digits,
    trimmed: joined.length - bits.length,
  };
}

export const bitExpansionStrategy: ExplanationStrategy = {
  supports: (fromBase, toBase) => toBase === TO_BASE && bitsPerDigit(fromBase) !== undefined,
  explain: (numeral, fromBase) => explainBitExpansion(numeral, fromBase),
};
