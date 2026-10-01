import {
  NUMBER_SYSTEMS,
  getNumberSystem,
  getNumberSystemByBase,
  isNumberSystemId,
} from './number-system';

describe('number systems', () => {
  it('lists the supported systems with their short labels', () => {
    expect(NUMBER_SYSTEMS.map((s) => [s.shortLabel, s.base])).toEqual([
      ['BIN', 2],
      ['OCT', 8],
      ['DEC', 10],
      ['DUO', 12],
      ['HEX', 16],
    ]);
  });

  it('exposes the valid digits of each system', () => {
    expect(getNumberSystem('binary').digits).toBe('01');
    expect(getNumberSystem('octal').digits).toBe('01234567');
    expect(getNumberSystem('decimal').digits).toBe('0123456789');
    expect(getNumberSystem('duodecimal').digits).toBe('0123456789AB');
    expect(getNumberSystem('hexadecimal').digits).toBe('0123456789ABCDEF');
  });

  it('finds a system by its base', () => {
    expect(getNumberSystemByBase(12)?.id).toBe('duodecimal');
    expect(getNumberSystemByBase(36)).toBeUndefined();
  });

  it('recognizes known system ids without throwing', () => {
    expect(isNumberSystemId('hexadecimal')).toBe(true);
    expect(isNumberSystemId('HEX')).toBe(false);
    expect(isNumberSystemId('ternary')).toBe(false);
    expect(isNumberSystemId(null)).toBe(false);
    expect(isNumberSystemId(16)).toBe(false);
  });
});
