import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SubscriptionService } from '../../core/subscription';
import { FakeSubscriptionGateway, provideFakeSubscription } from '../../core/subscription/subscription.testing';
import { NumberSystemId } from '../../domain/number-system';
import { CalculatorPage, KEYS } from './calculator.page';

describe('CalculatorPage', () => {
  let component: CalculatorPage;
  let fixture: ComponentFixture<CalculatorPage>;

  function press(...labels: string[]): void {
    for (const label of labels) {
      const key = KEYS.find((k) => k.label === label);
      if (!key) {
        throw new Error(`No key labelled ${label}`);
      }
      component.press(key);
    }
  }

  function typeIn(base: NumberSystemId, sequence: string): void {
    component.selectBase(base);
    press(...sequence.split(' '));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculatorPage],
      providers: [provideRouter([]), ...provideFakeSubscription('pro').providers],
    }).compileComponents();
    await TestBed.inject(SubscriptionService).initialize();

    fixture = TestBed.createComponent(CalculatorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('starts at 0 in decimal', () => {
    expect(component.systemId()).toBe('decimal');
    expect(component.entry()).toBe('0');
    expect(component.displayError()).toBeNull();
  });

  it.each([
    ['binary', '1 0 1 1 + 1 0 1 =', '10000', '1011 + 101 ='],
    ['decimal', '2 5 + 1 7 =', '42', '25 + 17 ='],
    ['hexadecimal', 'A + 5 =', 'F', 'A + 5 ='],
    ['hexadecimal', 'F F + 1 =', '100', 'FF + 1 ='],
    ['duodecimal', 'B + 1 =', '10', 'B + 1 ='],
    ['octal', '7 7 + 1 =', '100', '77 + 1 ='],
  ] as const)('in %s, %s gives %s', (base, sequence, result, expression) => {
    typeIn(base, sequence);

    expect(component.entry()).toBe(result);
    expect(component.expressionPreview()).toBe(expression);
  });

  it('subtracts, multiplies and divides exactly', () => {
    typeIn('decimal', '5 − 8 =');
    expect(component.entry()).toBe('-3');

    press('AC', '1', '2', '×', '1', '2', '=');
    expect(component.entry()).toBe('144');

    press('AC', '1', '4', '4', '÷', '1', '2', '=');
    expect(component.entry()).toBe('12');
  });

  it('ignores digits that do not exist in the selected base', () => {
    component.selectBase('binary');
    expect(component.isDisabled(KEYS.find((k) => k.label === '2')!)).toBe(true);
    expect(component.isDisabled(KEYS.find((k) => k.label === '1')!)).toBe(false);

    press('1', '2', 'F', '0');
    expect(component.entry()).toBe('10');

    component.selectBase('duodecimal');
    const enabled = KEYS.filter((k) => k.kind === 'digit' && !component.isDisabled(k)).map((k) => k.label);
    expect(enabled.sort().join('')).toBe('0123456789AB');
  });

  it('replaces a leading zero', () => {
    press('0', '0', '7');
    expect(component.entry()).toBe('7');
  });

  it('preserves the value when the base changes', () => {
    press('1', '5');

    component.selectBase('hexadecimal');
    expect(component.entry()).toBe('F');

    component.selectBase('binary');
    expect(component.entry()).toBe('1111');
  });

  it('keeps a pending operation across base changes', () => {
    press('1', '5', '+');
    component.selectBase('hexadecimal');
    expect(component.expressionPreview()).toBe('F +');

    press('1', '=');
    expect(component.entry()).toBe('10');

    component.selectBase('decimal');
    expect(component.entry()).toBe('16');
    expect(component.expressionPreview()).toBe('15 + 1 =');
  });

  it('chains operations', () => {
    press('1', '+', '2', '+');
    expect(component.entry()).toBe('3');
    expect(component.expressionPreview()).toBe('3 +');

    press('4', '×');
    expect(component.entry()).toBe('7');
    expect(component.highlightedOperator()).toBe('multiply');

    press('2', '=');
    expect(component.entry()).toBe('14');
  });

  it('replaces the operator when no second operand was entered', () => {
    press('9', '+', '−', '4', '=');
    expect(component.entry()).toBe('5');
  });

  it('reports an incomplete operation without losing it', () => {
    press('9', '+');
    expect(component.canExecute()).toBe(false);

    press('=');
    expect(component.displayError()).toBe('incomplete');
    expect(component.errorMessage()).toBe('Incomplete operation');

    press('1');
    expect(component.canExecute()).toBe(true);
    press('=');
    expect(component.entry()).toBe('10');
  });

  it('reports division by zero without throwing', () => {
    expect(() => press('7', '÷', '0', '=')).not.toThrow();

    expect(component.displayError()).toBe('division-by-zero');
    expect(component.errorMessage()).toBe('Division by zero');
    expect(component.expressionPreview()).toBe('7 ÷ 0');
    expect(component.canOpenInConverter()).toBe(false);

    press('+');
    expect(component.displayError()).toBe('division-by-zero');

    press('3');
    expect(component.displayError()).toBeNull();
    expect(component.entry()).toBe('3');
  });

  it('reports a fractional result instead of approximating it', () => {
    press('7', '÷', '2', '=');

    expect(component.displayError()).toBe('non-integral');
    expect(component.errorMessage()).toBe('Fractional result — coming with fraction support');
    expect(component.alternate()).toBe('');
  });

  it('reports division errors raised while chaining', () => {
    press('8', '÷', '0', '+');
    expect(component.displayError()).toBe('division-by-zero');
    expect(component.operator()).toBeNull();
  });

  it('deletes digits and clears everything', () => {
    press('1', '2', '3', '⌫');
    expect(component.entry()).toBe('12');

    press('⌫', '⌫');
    expect(component.entry()).toBe('0');

    press('5', '−', '9', '=', '⌫', '⌫');
    expect(component.entry()).toBe('0');

    press('4', '+', '1', 'AC');
    expect(component.entry()).toBe('0');
    expect(component.operator()).toBeNull();
    expect(component.accumulator()).toBeNull();
    expect(component.expressionPreview()).toBe('');
  });

  it('recovers from an error with backspace', () => {
    press('1', '÷', '0', '=', '⌫');
    expect(component.displayError()).toBeNull();
    expect(component.entry()).toBe('0');
  });

  it('shows the value in another base as the alternate representation', () => {
    press('2', '5', '5');
    expect(component.alternate()).toBe('HEX FF');

    component.selectBase('binary');
    expect(component.alternate()).toBe('DEC 255');
  });

  it('opens the current value in the Converter', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    typeIn('hexadecimal', 'F F + 1 =');
    component.openInConverter();

    expect(navigate).toHaveBeenCalledWith(['/tabs/converter'], {
      queryParams: { value: '100', from: 'hexadecimal' },
    });
  });

  it('does not open the Converter while showing an error', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    press('1', '÷', '0', '=');
    component.openInConverter();

    expect(navigate).not.toHaveBeenCalled();
  });

  it('renders a stable keypad with disabled digits', async () => {
    component.selectBase('binary');
    fixture.detectChanges();
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const keys = [...element.querySelectorAll<HTMLButtonElement>('.key')];
    expect(keys).toHaveLength(KEYS.length);
    expect(keys.find((k) => k.textContent?.trim() === 'F')?.disabled).toBe(true);
    expect(keys.find((k) => k.textContent?.trim() === '1')?.disabled).toBe(false);
    expect(element.querySelector('.display-value')?.textContent).toContain('0');
  });
});

describe('CalculatorPage base access', () => {
  let component: CalculatorPage;
  let fixture: ComponentFixture<CalculatorPage>;
  let gateway: FakeSubscriptionGateway;

  beforeEach(async () => {
    const subscription = provideFakeSubscription('free');
    gateway = subscription.gateway;
    await TestBed.configureTestingModule({
      imports: [CalculatorPage],
      providers: [provideRouter([]), ...subscription.providers],
    }).compileComponents();
    await TestBed.inject(SubscriptionService).initialize();

    fixture = TestBed.createComponent(CalculatorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('keeps locked bases visible with their required plan', () => {
    const element: HTMLElement = fixture.nativeElement;
    const octal = element.querySelector('[aria-label^="Octal"]');
    const hex = element.querySelector('[aria-label^="Hexadecimal"]');

    expect(element.querySelectorAll('.base')).toHaveLength(5);
    expect(octal?.classList).toContain('base-locked');
    expect(octal?.getAttribute('aria-label')).toContain('requires Pro');
    expect(hex?.classList).not.toContain('base-locked');
  });

  it('opens the paywall instead of switching to a locked base', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.selectBase('octal');

    expect(navigate).toHaveBeenCalledWith(['/paywall']);
    expect(component.systemId()).toBe('decimal');
  });

  it('still calculates without limits on Free', () => {
    component.selectBase('hexadecimal');
    for (const label of ['F', 'F', '+', '1', '=']) {
      component.press(KEYS.find((k) => k.label === label)!);
    }

    expect(component.entry()).toBe('100');
  });

  it('falls back to decimal when a paid base stops being available', async () => {
    gateway.emit(['pro']);
    component.selectBase('octal');
    expect(component.systemId()).toBe('octal');

    gateway.emit([]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.systemId()).toBe('decimal');
  });
});
