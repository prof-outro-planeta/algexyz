import { evaluateAnswer } from './evaluation';
import { generateQuestion } from './question';

describe('evaluateAnswer', () => {
  const toDecimal = generateQuestion({ type: 'direct', from: 'binary', to: 'decimal', value: 45 });
  const toHex = generateQuestion({ type: 'direct', from: 'decimal', to: 'hexadecimal', value: 255 });

  it('accepts the correct answer', () => {
    expect(evaluateAnswer(toDecimal, '45')).toEqual({
      correct: true,
      valid: true,
      expectedAnswer: '45',
      normalizedUserAnswer: '45',
    });
  });

  it('rejects a wrong answer and reports the expected one', () => {
    expect(evaluateAnswer(toDecimal, '44')).toEqual({
      correct: false,
      valid: true,
      expectedAnswer: '45',
      normalizedUserAnswer: '44',
    });
  });

  it('accepts lowercase hexadecimal', () => {
    const result = evaluateAnswer(toHex, 'ff');

    expect(result.correct).toBe(true);
    expect(result.normalizedUserAnswer).toBe('FF');
  });

  it('compares by value, ignoring leading zeros, spaces and the system prefix', () => {
    expect(evaluateAnswer(toHex, ' 00ff ').correct).toBe(true);
    expect(evaluateAnswer(toHex, '0xFF').correct).toBe(true);
    expect(evaluateAnswer(toDecimal, '045').normalizedUserAnswer).toBe('45');
  });

  it('marks digits outside the target base as invalid and incorrect', () => {
    const result = evaluateAnswer(toDecimal, '4A');

    expect(result.correct).toBe(false);
    expect(result.valid).toBe(false);
    expect(result.normalizedUserAnswer).toBe('4A');
  });

  it('treats an empty answer as invalid', () => {
    expect(evaluateAnswer(toDecimal, '   ').valid).toBe(false);
  });
});
