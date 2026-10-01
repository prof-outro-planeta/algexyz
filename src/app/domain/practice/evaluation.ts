import { formatNumeral, parseNumeral } from '../conversion';
import { getNumberSystem, isValidNumeral, normalizeNumeral } from '../number-system';
import { PracticeQuestion } from './question';

export interface PracticeAnswer {
  readonly questionId: string;
  readonly raw: string;
}

export interface PracticeResult {
  readonly correct: boolean;
  /** False when the answer is not a numeral of the target base. */
  readonly valid: boolean;
  readonly expectedAnswer: string;
  /** Canonical form of the answer when valid, otherwise the cleaned input. */
  readonly normalizedUserAnswer: string;
}

/**
 * Compares by value, not by text: `ff`, `FF`, `0xFF` and `00FF` are all
 * accepted for 255 in hexadecimal.
 */
export function evaluateAnswer(question: PracticeQuestion, raw: string): PracticeResult {
  const target = getNumberSystem(question.to);
  const cleaned = stripPrefix(normalizeNumeral(raw).replace(/\s+/g, ''), target.prefix);

  if (!isValidNumeral(cleaned, target.base)) {
    return { correct: false, valid: false, expectedAnswer: question.expectedAnswer, normalizedUserAnswer: cleaned };
  }

  const value = parseNumeral(cleaned, target.base);
  const expected = parseNumeral(question.expectedAnswer, target.base);
  return {
    correct: value === expected,
    valid: true,
    expectedAnswer: question.expectedAnswer,
    normalizedUserAnswer: formatNumeral(value, target.base),
  };
}

function stripPrefix(numeral: string, prefix: string): string {
  const upperPrefix = prefix.toUpperCase();
  return upperPrefix && numeral.startsWith(upperPrefix) ? numeral.slice(upperPrefix.length) : numeral;
}
