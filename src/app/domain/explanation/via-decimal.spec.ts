import { convert } from '../conversion';
import { explainConversion } from './explain-conversion';
import { explainViaDecimal } from './via-decimal';

describe('via decimal explanation (between non-decimal bases)', () => {
  it('explains 2F in base 16 as 57 in base 8, passing through 47 in base 10', () => {
    const explanation = explainViaDecimal('2F', 16, 8);

    expect(explanation.input).toEqual({ numeral: '2F', base: 16 });
    expect(explanation.output).toEqual({ numeral: '57', base: 8 });
    expect(explanation.toDecimal.output).toEqual({ numeral: '47', base: 10 });
    expect(explanation.fromDecimal.input).toEqual({ numeral: '47', base: 10 });
    expect(explanation.fromDecimal.steps.map((s) => s.remainder)).toEqual([7, 5]);
  });

  it('carries the sign through both steps', () => {
    const explanation = explainViaDecimal('-2F', 16, 8);

    expect(explanation.toDecimal.negative).toBe(true);
    expect(explanation.fromDecimal.negative).toBe(true);
    expect(explanation.output.numeral).toBe('-57');
  });

  it.each([
    ['BA9', 12, 16],
    ['6B1', 16, 12],
    ['777', 8, 12],
    ['101101', 2, 12],
    ['A0', 12, 2],
    ['FF', 16, 8],
    ['377', 8, 16],
    ['-0', 12, 8],
  ] as const)('matches convert() for %s from base %i to base %i', (numeral, from, to) => {
    expect(explainViaDecimal(numeral, from, to).output.numeral).toBe(convert(numeral, from, to));
  });
});

describe('explainConversion via decimal', () => {
  it.each([
    [16, 8],
    [8, 16],
    [12, 16],
    [2, 12],
    [12, 2],
  ])('explains base %i to base %i through decimal', (from, to) => {
    expect(explainConversion('10', from, to)?.strategy).toBe('via-decimal');
  });

  it('prefers the bit shortcuts for binary pairs', () => {
    expect(explainConversion('10', 2, 8)?.strategy).toBe('bit-grouping');
    expect(explainConversion('10', 16, 2)?.strategy).toBe('bit-expansion');
  });
});
