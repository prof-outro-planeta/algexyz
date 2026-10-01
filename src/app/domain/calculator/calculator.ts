import { formatNumeral, parseNumeral } from '../conversion';
import { isValidBase, isValidNumeral } from '../number-system';

export type Operator = 'add' | 'subtract' | 'multiply' | 'divide';

export const OPERATOR_SYMBOLS: Readonly<Record<Operator, string>> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
};

export type ArithmeticOutcome =
  | { readonly kind: 'value'; readonly value: bigint }
  | { readonly kind: 'division-by-zero' }
  | { readonly kind: 'non-integral'; readonly quotient: bigint; readonly remainder: bigint };

export function applyOperator(left: bigint, operator: Operator, right: bigint): ArithmeticOutcome {
  switch (operator) {
    case 'add':
      return { kind: 'value', value: left + right };
    case 'subtract':
      return { kind: 'value', value: left - right };
    case 'multiply':
      return { kind: 'value', value: left * right };
    case 'divide': {
      if (right === 0n) {
        return { kind: 'division-by-zero' };
      }
      const quotient = left / right;
      const remainder = left % right;
      return remainder === 0n
        ? { kind: 'value', value: quotient }
        : { kind: 'non-integral', quotient, remainder };
    }
  }
}

export type NumeralOutcome =
  | { readonly kind: 'value'; readonly numeral: string }
  | Exclude<ArithmeticOutcome, { kind: 'value' }>
  | { readonly kind: 'invalid-operand' };

export function calculateNumerals(
  left: string,
  operator: Operator,
  right: string,
  base: number,
): NumeralOutcome {
  if (!isValidBase(base) || !isValidNumeral(left, base) || !isValidNumeral(right, base)) {
    return { kind: 'invalid-operand' };
  }
  const outcome = applyOperator(parseNumeral(left, base), operator, parseNumeral(right, base));
  return outcome.kind === 'value'
    ? { kind: 'value', numeral: formatNumeral(outcome.value, base) }
    : outcome;
}
