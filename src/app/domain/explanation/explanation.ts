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
  /** Zeros added on the left so the first group is complete. */
  readonly padding: number;
  readonly groups: readonly BitGroup[];
}

export interface PlaceValueTerm {
  readonly digit: string;
  readonly digitValue: number;
  readonly exponent: number;
  readonly placeValue: bigint;
  readonly contribution: bigint;
}

export interface PositionalExpansionExplanation {
  readonly strategy: 'positional-expansion';
  readonly input: NumeralInBase;
  readonly output: NumeralInBase;
  readonly negative: boolean;
  /** Most significant digit first, matching how the numeral is written. */
  readonly terms: readonly PlaceValueTerm[];
}

export interface DivisionStep {
  readonly dividend: bigint;
  readonly quotient: bigint;
  readonly remainder: number;
  readonly digit: string;
}

export interface RepeatedDivisionExplanation {
  readonly strategy: 'repeated-division';
  readonly input: NumeralInBase;
  readonly output: NumeralInBase;
  readonly negative: boolean;
  /** In the order performed; the result reads the remainders from last to first. */
  readonly steps: readonly DivisionStep[];
}

export interface DigitBits {
  readonly digit: string;
  readonly value: number;
  readonly bits: string;
}

export interface BitExpansionExplanation {
  readonly strategy: 'bit-expansion';
  readonly input: NumeralInBase;
  readonly output: NumeralInBase;
  readonly groupSize: number;
  readonly digits: readonly DigitBits[];
  /** Leading zeros dropped from the joined bits. */
  readonly trimmed: number;
}

export interface ViaDecimalExplanation {
  readonly strategy: 'via-decimal';
  readonly input: NumeralInBase;
  readonly output: NumeralInBase;
  readonly toDecimal: PositionalExpansionExplanation;
  readonly fromDecimal: RepeatedDivisionExplanation;
}

export type ConversionExplanation =
  | BitGroupingExplanation
  | PositionalExpansionExplanation
  | RepeatedDivisionExplanation
  | BitExpansionExplanation
  | ViaDecimalExplanation;

export interface ExplanationStrategy {
  supports(fromBase: number, toBase: number): boolean;
  explain(numeral: string, fromBase: number, toBase: number): ConversionExplanation;
}
