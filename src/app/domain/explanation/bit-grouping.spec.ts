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
    expect(explanation.groups).toEqual([{ bits: '0110', value: 6, digit: '6' }]);
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

describe('explainConversion', () => {
  it('picks the bit grouping strategy for binary to hexadecimal', () => {
    expect(explainConversion('11010110', 2, 16)?.strategy).toBe('bit-grouping');
  });

  it('returns null when no strategy covers the pair of bases', () => {
    expect(explainConversion('10', 10, 2)).toBeNull();
  });
});
