import { convert, formatNumeral, parseNumeral } from './conversion';

describe('conversion', () => {
  it('parses numerals into their value', () => {
    expect(parseNumeral('1010', 2)).toBe(10n);
    expect(parseNumeral('ff', 16)).toBe(255n);
    expect(parseNumeral('-17', 8)).toBe(-15n);
    expect(parseNumeral('0', 10)).toBe(0n);
  });

  it('formats values in the target base', () => {
    expect(formatNumeral(10n, 2)).toBe('1010');
    expect(formatNumeral(255n, 16)).toBe('FF');
    expect(formatNumeral(-15n, 8)).toBe('-17');
    expect(formatNumeral(0n, 2)).toBe('0');
  });

  it('converts between bases', () => {
    expect(convert('255', 10, 2)).toBe('11111111');
    expect(convert('11111111', 2, 16)).toBe('FF');
    expect(convert('z', 36, 10)).toBe('35');
  });

  it('keeps precision for large numbers', () => {
    expect(convert('FFFFFFFFFFFFFFFFFFFF', 16, 10)).toBe('1208925819614629174706175');
  });

  it('rejects digits that do not belong to the base', () => {
    expect(() => parseNumeral('102', 2)).toThrow(RangeError);
  });
});
