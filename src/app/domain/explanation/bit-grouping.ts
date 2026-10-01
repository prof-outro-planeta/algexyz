import { digitChar, isValidNumeral, normalizeNumeral } from '../number-system';
import { BitGroup, BitGroupingExplanation, ExplanationStrategy } from './explanation';

const FROM_BASE = 2;
const TO_BASE = 16;
const GROUP_SIZE = 4;

export function explainBitGrouping(numeral: string): BitGroupingExplanation {
  if (!isValidNumeral(numeral, FROM_BASE)) {
    throw new RangeError(`"${numeral}" is not a valid base-${FROM_BASE} numeral`);
  }
  const normalized = normalizeNumeral(numeral);
  const negative = normalized.startsWith('-');
  const bits = (negative ? normalized.slice(1) : normalized).replace(/^0+(?=.)/, '');

  const paddedLength = Math.ceil(bits.length / GROUP_SIZE) * GROUP_SIZE;
  const paddedBits = bits.padStart(paddedLength, '0');

  const groups: BitGroup[] = [];
  for (let start = 0; start < paddedBits.length; start += GROUP_SIZE) {
    const groupBits = paddedBits.slice(start, start + GROUP_SIZE);
    const value = parseInt(groupBits, FROM_BASE);
    groups.push({ bits: groupBits, value, digit: digitChar(value) });
  }

  const digits = groups.map((group) => group.digit).join('');
  const signed = negative && digits !== '0' ? `-${digits}` : digits;

  return {
    strategy: 'bit-grouping',
    input: { numeral: normalized, base: FROM_BASE },
    output: { numeral: signed, base: TO_BASE },
    groupSize: GROUP_SIZE,
    paddedBits,
    groups,
  };
}

export const bitGroupingStrategy: ExplanationStrategy = {
  supports: (fromBase, toBase) => fromBase === FROM_BASE && toBase === TO_BASE,
  explain: (numeral) => explainBitGrouping(numeral),
};
