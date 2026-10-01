import { convert, formatNumeral } from '../conversion';
import {
  NUMBER_SYSTEMS,
  NumberSystem,
  NumberSystemId,
  getNumberSystem,
  isValidNumeral,
} from '../number-system';
import { RandomSource, defaultRandom, pick, randomInt, shuffle } from './random';

export type PracticeQuestionType = 'direct' | 'multiple-choice';

export type PracticeDifficulty = 'beginner';

export const PRACTICE_QUESTION_TYPES: readonly PracticeQuestionType[] = ['direct', 'multiple-choice'];

export const MULTIPLE_CHOICE_OPTIONS = 4;

const VALUE_RANGES: Readonly<Record<PracticeDifficulty, { readonly min: number; readonly max: number }>> = {
  beginner: { min: 6, max: 99 },
};

export interface PracticeQuestion {
  readonly id: string;
  readonly type: PracticeQuestionType;
  readonly difficulty: PracticeDifficulty;
  readonly from: NumberSystemId;
  readonly to: NumberSystemId;
  /** Source numeral, canonical form (uppercase, no leading zeros). */
  readonly numeral: string;
  /** Always produced by `convert()`. */
  readonly expectedAnswer: string;
  /** Shuffled options for multiple choice; empty for direct questions. */
  readonly choices: readonly string[];
}

export interface GenerateQuestionOptions {
  readonly random?: RandomSource;
  readonly type?: PracticeQuestionType;
  readonly difficulty?: PracticeDifficulty;
  readonly from?: NumberSystemId;
  readonly to?: NumberSystemId;
  readonly value?: number;
  /** Systems to draw from when `from`/`to` are not given; at least two. */
  readonly systems?: readonly NumberSystem[];
}

export function generateQuestion(options: GenerateQuestionOptions = {}): PracticeQuestion {
  const random = options.random ?? defaultRandom;
  const difficulty = options.difficulty ?? 'beginner';
  const type = options.type ?? pick(random, PRACTICE_QUESTION_TYPES);

  const systems = options.systems ?? NUMBER_SYSTEMS;
  const from = options.from ? getNumberSystem(options.from) : pick(random, systems);
  const to = options.to
    ? getNumberSystem(options.to)
    : pick(random, systems.filter((s) => s.id !== from.id));
  if (from.id === to.id) {
    throw new RangeError('Source and target systems must differ');
  }

  const range = VALUE_RANGES[difficulty];
  const value = options.value ?? randomInt(random, range.min, range.max);
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`Practice values must be non-negative integers, got ${value}`);
  }

  const numeral = formatNumeral(BigInt(value), from.base);
  const expectedAnswer = convert(numeral, from.base, to.base);
  const choices =
    type === 'multiple-choice'
      ? shuffle(random, [expectedAnswer, ...distractors(random, value, numeral, from, to, expectedAnswer)])
      : [];

  return {
    id: `${from.id}-${to.id}-${numeral}-${randomInt(random, 0, 0x7fffffff).toString(36)}`,
    type,
    difficulty,
    from: from.id,
    to: to.id,
    numeral,
    expectedAnswer,
    choices,
  };
}

/**
 * Wrong options modelled on real mistakes first (reading the source digits
 * as-is, answering in decimal), then nearby values. All are unique, valid in
 * the target base, and different from the expected answer.
 */
function distractors(
  random: RandomSource,
  value: number,
  numeral: string,
  from: NumberSystem,
  to: NumberSystem,
  expectedAnswer: string,
): string[] {
  const likelyMistakes = [numeral, formatNumeral(BigInt(value), 10)];
  const offsets = shuffle(random, [1, -1, 2, -2, to.base, -to.base, from.base, -from.base]);
  const nearby = offsets
    .map((offset) => value + offset)
    .filter((candidate) => candidate >= 0)
    .map((candidate) => formatNumeral(BigInt(candidate), to.base));

  const result: string[] = [];
  for (const candidate of [...likelyMistakes, ...nearby]) {
    if (result.length === MULTIPLE_CHOICE_OPTIONS - 1) {
      break;
    }
    if (candidate !== expectedAnswer && !result.includes(candidate) && isValidNumeral(candidate, to.base)) {
      result.push(candidate);
    }
  }
  return result;
}
