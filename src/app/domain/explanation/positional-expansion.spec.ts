import { convert } from '../conversion';
import { explainConversion } from './explain-conversion';
import { explainPositionalExpansion } from './positional-expansion';

describe('positional expansion explanation (any base to decimal)', () => {
  it('explains 11010110 in base 2 as 214 in base 10', () => {
    const explanation = explainPositionalExpansion('11010110', 2);

    expect(explanation.input).toEqual({ numeral: '11010110', base: 2 });
    expect(explanation.output).toEqual({ numeral: '214', base: 10 });
    expect(explanation.terms.map((t) => [t.digit, t.exponent, t.placeValue, t.contribution])).toEqual([
      ['1', 7, 128n, 128n],
      ['1', 6, 64n, 64n],
      ['0', 5, 32n, 0n],
      ['1', 4, 16n, 16n],
      ['0', 3, 8n, 0n],
      ['1', 2, 4n, 4n],
      ['1', 1, 2n, 2n],
      ['0', 0, 1n, 0n],
    ]);
  });

  it('multiplies digits above 1 by their place value', () => {
    const explanation = explainPositionalExpansion('2F', 16);

    expect(explanation.terms).toEqual([
      { digit: '2', digitValue: 2, exponent: 1, placeValue: 16n, contribution: 32n },
      { digit: 'F', digitValue: 15, exponent: 0, placeValue: 1n, contribution: 15n },
    ]);
    expect(explanation.output.numeral).toBe('47');
  });

  it('drops leading zeros but keeps a lone zero', () => {
    expect(explainPositionalExpansion('00101', 2).terms.map((t) => t.digit)).toEqual(['1', '0', '1']);
    expect(explainPositionalExpansion('000', 2).terms).toEqual([
      { digit: '0', digitValue: 0, exponent: 0, placeValue: 1n, contribution: 0n },
    ]);
  });

  it('keeps the sign outside the terms', () => {
    const explanation = explainPositionalExpansion('-101', 2);

    expect(explanation.negative).toBe(true);
    expect(explanation.output.numeral).toBe('-5');
    expect(explanation.terms.map((t) => t.digit)).toEqual(['1', '0', '1']);
    expect(explainPositionalExpansion('-0', 2).negative).toBe(false);
  });

  it.each([
    ['11010110', 2],
    ['1'.repeat(70), 2],
    ['777', 8],
    ['BA9', 12],
    ['-FF', 16],
    ['0', 16],
  ] as const)('matches convert() for %s in base %i', (numeral, base) => {
    expect(explainPositionalExpansion(numeral, base).output.numeral).toBe(convert(numeral, base, 10));
  });

  it('rejects digits outside the base', () => {
    expect(() => explainPositionalExpansion('102', 2)).toThrow(RangeError);
  });
});

describe('explainConversion with positional expansion', () => {
  it.each([2, 8, 12, 16])('explains base %i to decimal', (base) => {
    expect(explainConversion('101', base, 10)?.strategy).toBe('positional-expansion');
  });

  it('keeps bit grouping for binary to hexadecimal', () => {
    expect(explainConversion('101', 2, 16)?.strategy).toBe('bit-grouping');
  });

  it('does not explain decimal to decimal', () => {
    expect(explainConversion('10', 10, 10)).toBeNull();
  });
});
