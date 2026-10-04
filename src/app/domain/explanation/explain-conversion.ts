import { bitExpansionStrategy } from './bit-expansion';
import { bitGroupingStrategy } from './bit-grouping';
import { ConversionExplanation, ExplanationStrategy } from './explanation';
import { positionalExpansionStrategy } from './positional-expansion';
import { repeatedDivisionStrategy } from './repeated-division';
import { viaDecimalStrategy } from './via-decimal';

const strategies: readonly ExplanationStrategy[] = [
  bitGroupingStrategy,
  bitExpansionStrategy,
  positionalExpansionStrategy,
  repeatedDivisionStrategy,
  viaDecimalStrategy,
];

export function explainConversion(
  numeral: string,
  fromBase: number,
  toBase: number,
): ConversionExplanation | null {
  const strategy = strategies.find((s) => s.supports(fromBase, toBase));
  return strategy ? strategy.explain(numeral, fromBase, toBase) : null;
}
