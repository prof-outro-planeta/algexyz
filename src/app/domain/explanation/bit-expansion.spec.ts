import { convert } from '../conversion';
import { explainBitExpansion } from './bit-expansion';
import { explainConversion } from './explain-conversion';

describe('bit expansion explanation (octal or hexadecimal to binary)', () => {
  it('writes each hexadecimal digit as 4 bits and drops the leading zeros', () => {
    const explanation = explainBitExpansion('2F', 16);

    expect(explanation.input).toEqual({ numeral: '2F', base: 16 });
    expect(explanation.output).toEqual({ numeral: '101111', base: 2 });
    expect(explanation.groupSize).toBe(4);
    expect(explanation.digits).toEqual([
      { digit: '2', value: 2, bits: '0010' },
      { digit: 'F', value: 15, bits: '1111' },
    ]);
    expect(explanation.trimmed).toBe(2);
  });

  it('writes each octal digit as 3 bits', () => {
    const explanation = explainBitExpansion('755', 8);

    expect(explanation.groupSize).toBe(3);
    expect(explanation.digits.map((d) => d.bits)).toEqual(['111', '101', '101']);
    expect(explanation.output.numeral).toBe('111101101');
    expect(explanation.trimmed).toBe(0);
  });

  it('keeps a lone zero', () => {
    const explanation = explainBitExpansion('000', 16);

    expect(explanation.digits).toEqual([{ digit: '0', value: 0, bits: '0000' }]);
    expect(explanation.output.numeral).toBe('0');
    expect(explanation.trimmed).toBe(3);
  });

  it('keeps the sign outside the digits', () => {
    expect(explainBitExpansion('-B', 16).output.numeral).toBe('-1011');
    expect(explainBitExpansion('-0', 8).output.numeral).toBe('0');
  });

  it.each([
    ['2F', 16],
    ['00FF', 16],
    ['-1A', 16],
    ['F'.repeat(20), 16],
    ['755', 8],
    ['10', 8],
    ['-7', 8],
  ] as const)('matches convert() for %s in base %i', (numeral, base) => {
    expect(explainBitExpansion(numeral, base).output.numeral).toBe(convert(numeral, base, 2));
  });

  it('rejects bases without a bit shortcut', () => {
    expect(() => explainBitExpansion('12', 12)).toThrow(RangeError);
  });

  it('rejects digits outside the base', () => {
    expect(() => explainBitExpansion('8', 8)).toThrow(RangeError);
  });
});

describe('explainConversion with bit expansion', () => {
  it.each([8, 16])('explains base %i to binary', (base) => {
    expect(explainConversion('17', base, 2)?.strategy).toBe('bit-expansion');
  });
});
