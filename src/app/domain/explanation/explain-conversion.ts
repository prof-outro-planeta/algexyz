import { bitGroupingStrategy } from './bit-grouping';
import { ConversionExplanation, ExplanationStrategy } from './explanation';
import { positionalExpansionStrategy } from './positional-expansion';

const strategies: readonly ExplanationStrategy[] = [bitGroupingStrategy, positionalExpansionStrategy];

export function explainConversion(
  numeral: string,
  fromBase: number,
  toBase: number,
): ConversionExplanation | null {
  const strategy = strategies.find((s) => s.supports(fromBase, toBase));
  return strategy ? strategy.explain(numeral, fromBase, toBase) : null;
}
