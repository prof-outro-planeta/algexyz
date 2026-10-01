import { digitsForBase } from './digits';

export type NumberSystemId = 'binary' | 'octal' | 'decimal' | 'duodecimal' | 'hexadecimal';

export interface NumberSystem {
  readonly id: NumberSystemId;
  readonly name: string;
  readonly shortLabel: string;
  readonly base: number;
  readonly prefix: string;
  readonly digits: string;
}

export const NUMBER_SYSTEMS: readonly NumberSystem[] = [
  { id: 'binary', name: 'Binary', shortLabel: 'BIN', base: 2, prefix: '0b', digits: digitsForBase(2) },
  { id: 'octal', name: 'Octal', shortLabel: 'OCT', base: 8, prefix: '0o', digits: digitsForBase(8) },
  { id: 'decimal', name: 'Decimal', shortLabel: 'DEC', base: 10, prefix: '', digits: digitsForBase(10) },
  { id: 'duodecimal', name: 'Duodecimal', shortLabel: 'DUO', base: 12, prefix: '', digits: digitsForBase(12) },
  { id: 'hexadecimal', name: 'Hexadecimal', shortLabel: 'HEX', base: 16, prefix: '0x', digits: digitsForBase(16) },
];

export function isNumberSystemId(value: unknown): value is NumberSystemId {
  return NUMBER_SYSTEMS.some((s) => s.id === value);
}

export function getNumberSystem(id: NumberSystemId): NumberSystem {
  const system = NUMBER_SYSTEMS.find((s) => s.id === id);
  if (!system) {
    throw new Error(`Unknown number system: ${id}`);
  }
  return system;
}

export function getNumberSystemByBase(base: number): NumberSystem | undefined {
  return NUMBER_SYSTEMS.find((s) => s.base === base);
}
