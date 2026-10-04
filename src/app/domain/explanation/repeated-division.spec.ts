import { convert } from '../conversion';
import { explainConversion } from './explain-conversion';
import { explainRepeatedDivision } from './repeated-division';

describe('repeated division explanation (decimal to any base)', () => {
  it('explains 214 in base 10 as D6 in base 16', () => {
    const explanation = explainRepeatedDivision('214', 16);

    expect(explanation.input).toEqual({ numeral: '214', base: 10 });
    expect(explanation.output).toEqual({ numeral: 'D6', base: 16 });
    expect(explanation.steps).toEqual([
      { dividend: 214n, quotient: 13n, remainder: 6, digit: '6' },
      { dividend: 13n, quotient: 0n, remainder: 13, digit: 'D' },
    ]);
  });

  it('reads the remainders from the last division to the first', () => {
    const explanation = explainRepeatedDivision('214', 2);

    expect(explanation.steps.map((s) => s.remainder)).toEqual([0, 1, 1, 0, 1, 0, 1, 1]);
    expect(explanation.output.numeral).toBe('11010110');
  });

  it.each([
    [8, '326'],
    [12, '15A'],
  ] as const)('converts 214 to base %i', (base, expected) => {
    expect(explainRepeatedDivision('214', base).output.numeral).toBe(expected);
  });

  it('explains zero with a single division', () => {
    const explanation = explainRepeatedDivision('0', 2);

    expect(explanation.steps).toEqual([{ dividend: 0n, quotient: 0n, remainder: 0, digit: '0' }]);
    expect(explanation.output.numeral).toBe('0');
  });

  it('keeps the sign outside the divisions', () => {
    const explanation = explainRepeatedDivision('-47', 16);

    expect(explanation.negative).toBe(true);
    expect(explanation.output.numeral).toBe('-2F');
    expect(explanation.steps[0].dividend).toBe(47n);
    expect(explainRepeatedDivision('-0', 16).negative).toBe(false);
  });

  it.each([
    ['214', 2],
    ['214', 8],
    ['214', 12],
    ['214', 16],
    ['007', 2],
    ['-255', 16],
    ['9'.repeat(30), 36],
  ] as const)('matches convert() for %s in base %i', (numeral, base) => {
    expect(explainRepeatedDivision(numeral, base).output.numeral).toBe(convert(numeral, 10, base));
  });

  it('rejects digits outside base 10', () => {
    expect(() => explainRepeatedDivision('1A', 16)).toThrow(RangeError);
  });
});

describe('explainConversion with repeated division', () => {
  it.each([2, 8, 12, 16])('explains decimal to base %i', (base) => {
    expect(explainConversion('214', 10, base)?.strategy).toBe('repeated-division');
  });
});
