import { convert } from '../conversion';
import { explainBitGrouping } from './bit-grouping';
import { explainConversion } from './explain-conversion';

describe('bit grouping explanation (binary to hexadecimal)', () => {
  it('explains 11010110 in base 2 as D6 in base 16', () => {
    const explanation = explainBitGrouping('11010110');

    expect(explanation.input).toEqual({ numeral: '11010110', base: 2 });
    expect(explanation.output).toEqual({ numeral: 'D6', base: 16 });
    expect(explanation.groupSize).toBe(4);
    expect(explanation.groups).toEqual([
      { bits: '1101', value: 13, digit: 'D' },
      { bits: '0110', value: 6, digit: '6' },
    ]);
  });

  it('pads the leftmost group with zeros so groups are counted from the right', () => {
    const explanation = explainBitGrouping('110');

    expect(explanation.paddedBits).toBe('0110');
    expect(explanation.padding).toBe(1);
    expect(explanation.groups).toEqual([{ bits: '0110', value: 6, digit: '6' }]);
  });

  it('needs no padding when the bits already fill whole groups', () => {
    expect(explainBitGrouping('11010110').padding).toBe(0);
  });

  it('drops leading zero groups', () => {
    expect(explainBitGrouping('00000110').output.numeral).toBe('6');
  });

  it('keeps the sign outside the groups', () => {
    const explanation = explainBitGrouping('-1011');

    expect(explanation.output.numeral).toBe('-B');
    expect(explanation.groups).toEqual([{ bits: '1011', value: 11, digit: 'B' }]);
  });

  it.each(['0', '1', '110', '11111111', '-1011', '-0', '1'.repeat(70)])(
    'matches convert() for %s',
    (numeral) => {
      expect(explainBitGrouping(numeral).output.numeral).toBe(convert(numeral, 2, 16));
    },
  );

  it('rejects digits that are not bits', () => {
    expect(() => explainBitGrouping('102')).toThrow(RangeError);
  });
});

describe('bit grouping explanation (binary to octal)', () => {
  it('explains 11010110 in base 2 as 326 in base 8 with groups of 3', () => {
    const explanation = explainBitGrouping('11010110', 8);

    expect(explanation.output).toEqual({ numeral: '326', base: 8 });
    expect(explanation.groupSize).toBe(3);
    expect(explanation.paddedBits).toBe('011010110');
    expect(explanation.padding).toBe(1);
    expect(explanation.groups).toEqual([
      { bits: '011', value: 3, digit: '3' },
      { bits: '010', value: 2, digit: '2' },
      { bits: '110', value: 6, digit: '6' },
    ]);
  });

  it.each(['0', '1', '111', '1000', '-101', '1'.repeat(70)])('matches convert() for %s', (numeral) => {
    expect(explainBitGrouping(numeral, 8).output.numeral).toBe(convert(numeral, 2, 8));
  });

  it('rejects bases without a bit shortcut', () => {
    expect(() => explainBitGrouping('101', 12)).toThrow(RangeError);
  });
});

describe('explainConversion', () => {
  it.each([8, 16])('picks the bit grouping strategy for binary to base %i', (base) => {
    expect(explainConversion('11010110', 2, base)?.strategy).toBe('bit-grouping');
  });

  it('returns null when source and target are the same base', () => {
    expect(explainConversion('10', 2, 2)).toBeNull();
  });
});
