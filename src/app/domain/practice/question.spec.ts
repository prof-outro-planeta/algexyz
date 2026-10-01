import { convert } from '../conversion';
import { NUMBER_SYSTEMS, getNumberSystem, isValidNumeral } from '../number-system';
import { MULTIPLE_CHOICE_OPTIONS, generateQuestion } from './question';
import { seededRandom } from './random';

describe('generateQuestion', () => {
  it('builds a direct conversion question whose answer comes from convert()', () => {
    const question = generateQuestion({ type: 'direct', from: 'binary', to: 'decimal', value: 45 });

    expect(question.type).toBe('direct');
    expect(question.numeral).toBe('101101');
    expect(question.expectedAnswer).toBe('45');
    expect(question.expectedAnswer).toBe(convert('101101', 2, 10));
    expect(question.choices).toEqual([]);
  });

  it('builds a multiple-choice question with four options including the correct one', () => {
    const question = generateQuestion({
      type: 'multiple-choice',
      from: 'binary',
      to: 'hexadecimal',
      value: 45,
      random: seededRandom(7),
    });

    expect(question.expectedAnswer).toBe('2D');
    expect(question.choices).toHaveLength(MULTIPLE_CHOICE_OPTIONS);
    expect(question.choices).toContain('2D');
  });

  it('never repeats an option or the correct answer across many random questions', () => {
    const random = seededRandom(42);
    for (let i = 0; i < 300; i++) {
      const question = generateQuestion({ type: 'multiple-choice', random });
      const base = getNumberSystem(question.to).base;

      expect(new Set(question.choices).size).toBe(MULTIPLE_CHOICE_OPTIONS);
      expect(question.choices.filter((choice) => choice === question.expectedAnswer)).toHaveLength(1);
      for (const choice of question.choices) {
        expect(isValidNumeral(choice, base)).toBe(true);
      }
    }
  });

  it('always uses two different systems and derives the answer from convert()', () => {
    const random = seededRandom(3);
    for (let i = 0; i < 300; i++) {
      const question = generateQuestion({ random });
      const from = getNumberSystem(question.from);
      const to = getNumberSystem(question.to);

      expect(question.from).not.toBe(question.to);
      expect(question.expectedAnswer).toBe(convert(question.numeral, from.base, to.base));
    }
  });

  it('is reproducible with the same seed', () => {
    const a = generateQuestion({ random: seededRandom(99) });
    const b = generateQuestion({ random: seededRandom(99) });

    expect(a).toEqual(b);
  });

  it('keeps beginner values small', () => {
    const random = seededRandom(5);
    for (let i = 0; i < 200; i++) {
      const question = generateQuestion({ random });
      const value = Number.parseInt(question.numeral, getNumberSystem(question.from).base);

      expect(value).toBeGreaterThanOrEqual(6);
      expect(value).toBeLessThanOrEqual(99);
    }
  });

  it('only draws from the given systems', () => {
    const systems = NUMBER_SYSTEMS.filter((s) => [2, 10, 16].includes(s.base));
    const random = seededRandom(8);
    for (let i = 0; i < 200; i++) {
      const question = generateQuestion({ random, systems });
      expect(['binary', 'decimal', 'hexadecimal']).toContain(question.from);
      expect(['binary', 'decimal', 'hexadecimal']).toContain(question.to);
    }
  });

  it('rejects identical source and target systems', () => {
    expect(() => generateQuestion({ from: 'octal', to: 'octal' })).toThrow(RangeError);
  });
});
