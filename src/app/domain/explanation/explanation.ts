export interface NumeralInBase {
  readonly numeral: string;
  readonly base: number;
}

export interface BitGroup {
  readonly bits: string;
  readonly value: number;
  readonly digit: string;
}

export interface BitGroupingExplanation {
  readonly strategy: 'bit-grouping';
  readonly input: NumeralInBase;
  readonly output: NumeralInBase;
  readonly groupSize: number;
  readonly paddedBits: string;
  readonly groups: readonly BitGroup[];
}

export type ConversionExplanation = BitGroupingExplanation;

export interface ExplanationStrategy {
  supports(fromBase: number, toBase: number): boolean;
  explain(numeral: string, fromBase: number, toBase: number): ConversionExplanation;
}
