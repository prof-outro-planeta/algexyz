import { digitValue, isValidNumeral, normalizeNumeral } from '../number-system';
import { ExplanationStrategy, PlaceValueTerm, PositionalExpansionExplanation } from './explanation';

const TO_BASE = 10;

export function explainPositionalExpansion(numeral: string, fromBase: number): PositionalExpansionExplanation {
  if (!isValidNumeral(numeral, fromBase)) {
    throw new RangeError(`"${numeral}" is not a valid base-${fromBase} numeral`);
  }
  const normalized = normalizeNumeral(numeral);
  const negative = normalized.startsWith('-');
  const digits = (negative ? normalized.slice(1) : normalized).replace(/^0+(?=.)/, '');

  const base = BigInt(fromBase);
  const terms: PlaceValueTerm[] = [...digits].map((digit, index) => {
    const exponent = digits.length - 1 - index;
    const value = digitValue(digit);
    const placeValue = base ** BigInt(exponent);
    return { digit, digitValue: value, exponent, placeValue, contribution: BigInt(value) * placeValue };
  });

  const total = terms.reduce((sum, term) => sum + term.contribution, 0n);
  const signed = negative && total !== 0n ? `-${total}` : `${total}`;

  return {
    strategy: 'positional-expansion',
    input: { numeral: normalized, base: fromBase },
    output: { numeral: signed, base: TO_BASE },
    negative: negative && total !== 0n,
    terms,
  };
}

export const positionalExpansionStrategy: ExplanationStrategy = {
  supports: (fromBase, toBase) => toBase === TO_BASE && fromBase !== TO_BASE,
  explain: (numeral, fromBase) => explainPositionalExpansion(numeral, fromBase),
};
