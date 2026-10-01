import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular';
import { PLAN_LABELS, SubscriptionCapabilities } from '../../core/subscription';
import { OPERATOR_SYMBOLS, Operator, applyOperator } from '../../domain/calculator';
import { formatNumeral, parseNumeral } from '../../domain/conversion';
import { NUMBER_SYSTEMS, NumberSystemId, getNumberSystem } from '../../domain/number-system';

export type CalculatorError = 'division-by-zero' | 'non-integral' | 'incomplete' | 'invalid';

export type CalculatorKey =
  | { readonly kind: 'digit'; readonly label: string }
  | { readonly kind: 'operator'; readonly label: string; readonly operator: Operator; readonly ariaLabel: string }
  | { readonly kind: 'clear' | 'backspace' | 'equals'; readonly label: string; readonly ariaLabel: string };

interface Expression {
  readonly left: bigint;
  readonly operator: Operator;
  readonly right: bigint;
}

const MAX_ENTRY_LENGTH = 64;

const ERROR_MESSAGES: Readonly<Record<CalculatorError, string>> = {
  'division-by-zero': 'Division by zero',
  'non-integral': 'Fractional result — coming with fraction support',
  incomplete: 'Incomplete operation',
  invalid: 'Something went wrong — press AC',
};

const digit = (label: string): CalculatorKey => ({ kind: 'digit', label });
const operatorKey = (operator: Operator, ariaLabel: string): CalculatorKey => ({
  kind: 'operator',
  label: OPERATOR_SYMBOLS[operator],
  operator,
  ariaLabel,
});

// Grid order matters: AC spans 2 columns, = spans 3 rows, 0 spans 3 columns.
export const KEYS: readonly CalculatorKey[] = [
  { kind: 'clear', label: 'AC', ariaLabel: 'All clear' },
  { kind: 'backspace', label: '⌫', ariaLabel: 'Delete last digit' },
  operatorKey('divide', 'Divide'),
  digit('A'),
  digit('B'),
  digit('C'),
  operatorKey('multiply', 'Multiply'),
  digit('D'),
  digit('E'),
  digit('F'),
  operatorKey('subtract', 'Subtract'),
  digit('7'),
  digit('8'),
  digit('9'),
  operatorKey('add', 'Add'),
  digit('4'),
  digit('5'),
  digit('6'),
  { kind: 'equals', label: '=', ariaLabel: 'Equals' },
  digit('1'),
  digit('2'),
  digit('3'),
  digit('0'),
];

@Component({
  selector: 'app-calculator',
  templateUrl: 'calculator.page.html',
  styleUrls: ['calculator.page.scss'],
  imports: [IonHeader, IonToolbar, IonContent],
})
export class CalculatorPage {
  private readonly router = inject(Router);
  private readonly capabilities = inject(SubscriptionCapabilities);

  readonly systems = NUMBER_SYSTEMS;
  readonly keys = KEYS;

  readonly systemId = signal<NumberSystemId>('decimal');
  readonly entry = signal('0');
  readonly accumulator = signal<bigint | null>(null);
  readonly operator = signal<Operator | null>(null);
  readonly fresh = signal(false);
  readonly lastExpression = signal<Expression | null>(null);
  readonly error = signal<CalculatorError | null>(null);

  readonly system = computed(() => getNumberSystem(this.systemId()));

  readonly enabledDigits = computed(() => new Set(this.system().digits));

  readonly entryValue = computed<bigint | null>(() => {
    try {
      return parseNumeral(this.entry(), this.system().base);
    } catch {
      return null;
    }
  });

  readonly displayError = computed<CalculatorError | null>(
    () => this.error() ?? (this.entryValue() === null ? 'invalid' : null),
  );

  readonly errorMessage = computed(() => {
    const error = this.displayError();
    return error === null ? null : ERROR_MESSAGES[error];
  });

  readonly expressionPreview = computed(() => {
    const last = this.lastExpression();
    if (last) {
      const preview = `${this.format(last.left)} ${OPERATOR_SYMBOLS[last.operator]} ${this.format(last.right)}`;
      return this.error() === null ? `${preview} =` : preview;
    }
    const accumulator = this.accumulator();
    const operator = this.operator();
    return accumulator !== null && operator !== null
      ? `${this.format(accumulator)} ${OPERATOR_SYMBOLS[operator]}`
      : '';
  });

  readonly highlightedOperator = computed(() =>
    this.fresh() && this.displayError() === null ? this.operator() : null,
  );

  readonly alternate = computed(() => {
    const value = this.entryValue();
    if (value === null || this.displayError() !== null) {
      return '';
    }
    const other = getNumberSystem(this.systemId() === 'decimal' ? 'hexadecimal' : 'decimal');
    return `${other.shortLabel} ${formatNumeral(value, other.base)}`;
  });

  readonly canExecute = computed(
    () =>
      this.displayError() === null &&
      this.accumulator() !== null &&
      this.operator() !== null &&
      !this.fresh(),
  );

  readonly canOpenInConverter = computed(
    () => this.displayError() === null && this.entryValue() !== null,
  );

  constructor() {
    // A subscription can lapse while a paid base is selected.
    effect(() => {
      if (!this.isUnlocked(this.systemId())) {
        untracked(() => this.selectBase('decimal'));
      }
    });
  }

  isUnlocked(id: NumberSystemId): boolean {
    return this.capabilities.canUseBase(getNumberSystem(id).base);
  }

  requiredPlanLabel(id: NumberSystemId): string {
    const plan = this.capabilities.requiredPlanForBase(getNumberSystem(id).base);
    return plan ? PLAN_LABELS[plan] : '';
  }

  isDisabled(key: CalculatorKey): boolean {
    return key.kind === 'digit' && !this.enabledDigits().has(key.label);
  }

  isHighlighted(key: CalculatorKey): boolean {
    return key.kind === 'operator' && key.operator === this.highlightedOperator();
  }

  press(key: CalculatorKey): void {
    switch (key.kind) {
      case 'digit':
        return this.pressDigit(key.label);
      case 'operator':
        return this.pressOperator(key.operator);
      case 'equals':
        return this.equals();
      case 'backspace':
        return this.backspace();
      case 'clear':
        return this.clear();
    }
  }

  pressDigit(char: string): void {
    if (!this.enabledDigits().has(char)) {
      return;
    }
    if (this.error() !== null || this.fresh()) {
      this.error.set(null);
      this.lastExpression.set(null);
      this.entry.set(char);
      this.fresh.set(false);
      return;
    }
    const current = this.entry();
    if (current === '0') {
      this.entry.set(char);
    } else if (current.length < MAX_ENTRY_LENGTH) {
      this.entry.set(current + char);
    }
  }

  pressOperator(operator: Operator): void {
    if (this.error() === 'incomplete') {
      this.error.set(null);
    }
    if (this.displayError() !== null) {
      return;
    }
    const value = this.entryValue();
    if (value === null) {
      return;
    }
    const accumulator = this.accumulator();
    const pending = this.operator();
    if (accumulator !== null && pending !== null) {
      if (!this.fresh()) {
        const outcome = applyOperator(accumulator, pending, value);
        if (outcome.kind !== 'value') {
          this.fail(outcome.kind, { left: accumulator, operator: pending, right: value });
          return;
        }
        this.accumulator.set(outcome.value);
        this.entry.set(this.format(outcome.value));
      }
    } else {
      this.accumulator.set(value);
    }
    this.operator.set(operator);
    this.fresh.set(true);
    this.lastExpression.set(null);
  }

  equals(): void {
    if (this.displayError() !== null) {
      return;
    }
    const accumulator = this.accumulator();
    const operator = this.operator();
    if (accumulator === null || operator === null) {
      return;
    }
    if (this.fresh()) {
      this.error.set('incomplete');
      return;
    }
    const right = this.entryValue();
    if (right === null) {
      return;
    }
    const expression: Expression = { left: accumulator, operator, right };
    const outcome = applyOperator(accumulator, operator, right);
    if (outcome.kind !== 'value') {
      this.fail(outcome.kind, expression);
      return;
    }
    this.entry.set(this.format(outcome.value));
    this.accumulator.set(null);
    this.operator.set(null);
    this.fresh.set(true);
    this.lastExpression.set(expression);
  }

  backspace(): void {
    const error = this.error();
    if (error !== null) {
      this.error.set(null);
      if (error !== 'incomplete') {
        this.resetEntry();
      }
      return;
    }
    if (this.fresh() && this.operator() !== null) {
      return;
    }
    const next = this.entry().slice(0, -1);
    this.entry.set(next === '' || next === '-' ? '0' : next);
    this.fresh.set(false);
    this.lastExpression.set(null);
  }

  clear(): void {
    this.accumulator.set(null);
    this.operator.set(null);
    this.error.set(null);
    this.resetEntry();
  }

  selectBase(id: NumberSystemId): void {
    if (!this.isUnlocked(id)) {
      void this.router.navigate(['/paywall']);
      return;
    }
    const value = this.entryValue();
    this.systemId.set(id);
    if (value === null) {
      this.entry.set('0');
    } else {
      this.entry.set(formatNumeral(value, this.system().base));
    }
  }

  openInConverter(): void {
    if (!this.canOpenInConverter()) {
      return;
    }
    void this.router.navigate(['/tabs/converter'], {
      queryParams: { value: this.entry(), from: this.systemId() },
    });
  }

  private fail(error: CalculatorError, expression: Expression): void {
    this.error.set(error);
    this.accumulator.set(null);
    this.operator.set(null);
    this.entry.set('0');
    this.fresh.set(true);
    this.lastExpression.set(expression);
  }

  private resetEntry(): void {
    this.entry.set('0');
    this.fresh.set(false);
    this.lastExpression.set(null);
  }

  private format(value: bigint): string {
    return formatNumeral(value, this.system().base);
  }
}
