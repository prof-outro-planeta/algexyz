import { digitChar, isValidNumeral, normalizeNumeral } from '../number-system';
import { BitGroup, BitGroupingExplanation, ExplanationStrategy } from './explanation';

const FROM_BASE = 2;

const BITS_PER_DIGIT: ReadonlyMap<number, number> = new Map([
  [8, 3],
  [16, 4],
]);

/** Bits per digit for bases with a binary shortcut (8 and 16), or undefined otherwise. */
export function bitsPerDigit(base: number): number | undefined {
  return BITS_PER_DIGIT.get(base);
}

export function explainBitGrouping(numeral: string, toBase = 16): BitGroupingExplanation {
  const groupSize = bitsPerDigit(toBase);
  if (groupSize === undefined) {
    throw new RangeError(`Bit grouping does not support base ${toBase}`);
  }
  if (!isValidNumeral(numeral, FROM_BASE)) {
    throw new RangeError(`"${numeral}" is not a valid base-${FROM_BASE} numeral`);
  }
  const normalized = normalizeNumeral(numeral);
  const negative = normalized.startsWith('-');
  const bits = (negative ? normalized.slice(1) : normalized).replace(/^0+(?=.)/, '');

  const paddedLength = Math.ceil(bits.length / groupSize) * groupSize;
  const paddedBits = bits.padStart(paddedLength, '0');

  const groups: BitGroup[] = [];
  for (let start = 0; start < paddedBits.length; start += groupSize) {
    const groupBits = paddedBits.slice(start, start + groupSize);
    const value = parseInt(groupBits, FROM_BASE);
    groups.push({ bits: groupBits, value, digit: digitChar(value) });
  }

  const digits = groups.map((group) => group.digit).join('');
  const signed = negative && digits !== '0' ? `-${digits}` : digits;

  return {
    strategy: 'bit-grouping',
    input: { numeral: normalized, base: FROM_BASE },
    output: { numeral: signed, base: toBase },
    groupSize,
    paddedBits,
    padding: paddedLength - bits.length,
    groups,
  };
}

export const bitGroupingStrategy: ExplanationStrategy = {
  supports: (fromBase, toBase) => fromBase === FROM_BASE && bitsPerDigit(toBase) !== undefined,
  explain: (numeral, _fromBase, toBase) => explainBitGrouping(numeral, toBase),
};
