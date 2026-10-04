import { ExplanationStrategy, ViaDecimalExplanation } from './explanation';
import { explainPositionalExpansion } from './positional-expansion';
import { explainRepeatedDivision } from './repeated-division';

const DECIMAL = 10;

export function explainViaDecimal(numeral: string, fromBase: number, toBase: number): ViaDecimalExplanation {
  const toDecimal = explainPositionalExpansion(numeral, fromBase);
  const fromDecimal = explainRepeatedDivision(toDecimal.output.numeral, toBase);

  return {
    strategy: 'via-decimal',
    input: toDecimal.input,
    output: fromDecimal.output,
    toDecimal,
    fromDecimal,
  };
}

export const viaDecimalStrategy: ExplanationStrategy = {
  supports: (fromBase, toBase) => fromBase !== DECIMAL && toBase !== DECIMAL && fromBase !== toBase,
  explain: (numeral, fromBase, toBase) => explainViaDecimal(numeral, fromBase, toBase),
};
