import {
  digitChar,
  digitValue,
  digitsForBase,
  invalidDigits,
  isValidBase,
  isValidNumeral,
} from './digits';

describe('digits', () => {
  it('accepts bases from 2 to 36', () => {
    expect(isValidBase(2)).toBe(true);
    expect(isValidBase(36)).toBe(true);
    expect(isValidBase(1)).toBe(false);
    expect(isValidBase(37)).toBe(false);
    expect(isValidBase(2.5)).toBe(false);
  });

  it('maps digits to values and back', () => {
    expect(digitValue('7')).toBe(7);
    expect(digitValue('f')).toBe(15);
    expect(digitChar(15)).toBe('F');
  });

  it('lists the digits available in a base', () => {
    expect(digitsForBase(2)).toBe('01');
    expect(digitsForBase(12)).toBe('0123456789AB');
    expect(digitsForBase(36)).toHaveLength(36);
    expect(() => digitsForBase(37)).toThrow(RangeError);
  });

  it('validates numerals against the base', () => {
    expect(isValidNumeral('1010', 2)).toBe(true);
    expect(isValidNumeral('102', 2)).toBe(false);
    expect(isValidNumeral('ff', 16)).toBe(true);
    expect(isValidNumeral('-17', 8)).toBe(true);
    expect(isValidNumeral('', 10)).toBe(false);
    expect(isValidNumeral('-', 10)).toBe(false);
  });

  it('lists the characters that do not belong to the base', () => {
    expect(invalidDigits('1010', 2)).toEqual([]);
    expect(invalidDigits('102', 2)).toEqual(['2']);
    expect(invalidDigits('19a9g', 10)).toEqual(['A', 'G']);
    expect(invalidDigits('-12', 2)).toEqual(['2']);
    expect(invalidDigits('1-0', 2)).toEqual(['-']);
  });

  it('rejects invalid bases', () => {
    expect(() => isValidNumeral('1', 1)).toThrow(RangeError);
  });
});
