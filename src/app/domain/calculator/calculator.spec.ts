import { convert, parseNumeral } from '../conversion';
import { applyOperator, calculateNumerals } from './calculator';

describe('calculator', () => {
  describe('calculateNumerals', () => {
    it.each([
      ['1011', '101', 2, '10000'],
      ['25', '17', 10, '42'],
      ['A', '5', 16, 'F'],
      ['FF', '1', 16, '100'],
      ['77', '1', 8, '100'],
      ['B', '1', 12, '10'],
    ])('adds %s + %s in base %i to %s', (left, right, base, expected) => {
      expect(calculateNumerals(left, 'add', right, base)).toEqual({ kind: 'value', numeral: expected });
    });

    it('accepts lowercase digits and formats the result in uppercase', () => {
      expect(calculateNumerals('a', 'add', 'f', 16)).toEqual({ kind: 'value', numeral: '19' });
    });

    it('subtracts, including negative results', () => {
      expect(calculateNumerals('100', 'subtract', '1', 16)).toEqual({ kind: 'value', numeral: 'FF' });
      expect(calculateNumerals('101', 'subtract', '1011', 2)).toEqual({ kind: 'value', numeral: '-110' });
    });

    it('multiplies', () => {
      expect(calculateNumerals('B', 'multiply', 'B', 12)).toEqual({ kind: 'value', numeral: 'A1' });
      expect(calculateNumerals('111', 'multiply', '10', 2)).toEqual({ kind: 'value', numeral: '1110' });
    });

    it('divides exactly', () => {
      expect(calculateNumerals('FF', 'divide', '5', 16)).toEqual({ kind: 'value', numeral: '33' });
      expect(calculateNumerals('-12', 'divide', '4', 10)).toEqual({ kind: 'value', numeral: '-3' });
    });

    it('reports division by zero', () => {
      expect(calculateNumerals('7', 'divide', '0', 10)).toEqual({ kind: 'division-by-zero' });
    });

    it('reports non-integral division with the exact quotient and remainder', () => {
      expect(calculateNumerals('7', 'divide', '2', 10)).toEqual({
        kind: 'non-integral',
        quotient: 3n,
        remainder: 1n,
      });
    });

    it('reports invalid operands without throwing', () => {
      expect(calculateNumerals('102', 'add', '1', 2)).toEqual({ kind: 'invalid-operand' });
      expect(calculateNumerals('', 'add', '1', 10)).toEqual({ kind: 'invalid-operand' });
      expect(calculateNumerals('1', 'add', '1', 1)).toEqual({ kind: 'invalid-operand' });
    });

    it('keeps precision beyond 2^64', () => {
      expect(calculateNumerals('F'.repeat(20), 'multiply', '2', 16)).toEqual({
        kind: 'value',
        numeral: `1${'F'.repeat(19)}E`,
      });
      expect(calculateNumerals('18446744073709551616', 'add', '1', 10)).toEqual({
        kind: 'value',
        numeral: '18446744073709551617',
      });
      expect(calculateNumerals('9'.repeat(20), 'multiply', '9'.repeat(20), 10)).toEqual({
        kind: 'value',
        numeral: `${'9'.repeat(19)}8${'0'.repeat(19)}1`,
      });
    });
  });

  describe('applyOperator', () => {
    it('works on BigInt values', () => {
      expect(applyOperator(2n ** 70n, 'divide', 2n ** 6n)).toEqual({ kind: 'value', value: 2n ** 64n });
      expect(applyOperator(-7n, 'divide', 2n)).toEqual({ kind: 'non-integral', quotient: -3n, remainder: -1n });
    });

    it('produces the same value regardless of the base used to display it', () => {
      const outcome = applyOperator(parseNumeral('F', 16), 'add', parseNumeral('1', 16));
      expect(outcome).toEqual({ kind: 'value', value: 16n });
      expect(convert('10', 16, 10)).toBe('16');
      expect(convert('10', 16, 2)).toBe('10000');
    });
  });
});
