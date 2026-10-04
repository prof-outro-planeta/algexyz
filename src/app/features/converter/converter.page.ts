import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { IonContent, IonHeader, IonModal, IonToolbar } from '@ionic/angular';
import { PLAN_LABELS, SubscriptionCapabilities } from '../../core/subscription';
import { convert } from '../../domain/conversion';
import { explainConversion } from '../../domain/explanation';
import {
  NUMBER_SYSTEMS,
  NumberSystemId,
  getNumberSystem,
  invalidDigits,
  isNumberSystemId,
  isValidNumeral,
  normalizeNumeral,
} from '../../domain/number-system';
import { ConversionStepsComponent } from '../../shared/conversion-steps/conversion-steps.component';
import { PlanButtonComponent } from '../../shared/plan-button/plan-button.component';

export type ConverterValidation =
  | { readonly status: 'empty' }
  | { readonly status: 'valid' }
  | { readonly status: 'invalid'; readonly invalidDigits: readonly string[] };

type PickerTarget = 'from' | 'to';

@Component({
  selector: 'app-converter',
  templateUrl: 'converter.page.html',
  styleUrls: ['converter.page.scss'],
  imports: [IonHeader, IonToolbar, IonContent, IonModal, ConversionStepsComponent, PlanButtonComponent],
})
export class ConverterPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly capabilities = inject(SubscriptionCapabilities);
  private paywallAfterDismiss = false;

  readonly systems = NUMBER_SYSTEMS;

  readonly input = signal('11010110');
  readonly sourceId = signal<NumberSystemId>('binary');
  readonly targetId = signal<NumberSystemId>('hexadecimal');
  readonly picker = signal<PickerTarget | null>(null);

  readonly source = computed(() => getNumberSystem(this.sourceId()));
  readonly target = computed(() => getNumberSystem(this.targetId()));

  readonly validation = computed<ConverterValidation>(() => {
    const raw = this.input().trim();
    if (!raw) {
      return { status: 'empty' };
    }
    const base = this.source().base;
    return isValidNumeral(raw, base)
      ? { status: 'valid' }
      : { status: 'invalid', invalidDigits: invalidDigits(raw, base) };
  });

  readonly result = computed(() =>
    this.validation().status === 'valid'
      ? convert(this.input(), this.source().base, this.target().base)
      : null,
  );

  readonly explanation = computed(() =>
    this.validation().status === 'valid'
      ? explainConversion(this.input(), this.source().base, this.target().base)
      : null,
  );

  readonly normalizedInput = computed(() => normalizeNumeral(this.input()));

  readonly inputMode = computed(() => (this.source().base <= 10 ? 'numeric' : 'text'));

  readonly validDigitsLabel = computed(() => [...this.source().digits].join(' '));

  readonly invalidMessage = computed(() => {
    const validation = this.validation();
    if (validation.status !== 'invalid') {
      return null;
    }
    const base = this.source().base;
    const chars = validation.invalidDigits;
    if (chars.length === 0) {
      return 'Enter at least one digit.';
    }
    return chars.length === 1
      ? `Digit ${chars[0]} doesn't exist in base ${base}.`
      : `Digits ${chars.join(', ')} don't exist in base ${base}.`;
  });

  readonly pickerTitle = computed(() => (this.picker() === 'to' ? 'Target base' : 'Source base'));

  readonly pickedId = computed(() => (this.picker() === 'to' ? this.targetId() : this.sourceId()));

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.applyQueryParams(params));

    // A subscription can lapse while a paid base is selected.
    effect(() => {
      if (!this.isUnlocked(this.sourceId())) {
        this.sourceId.set(this.fallbackSystem(this.targetId()));
      }
      if (!this.isUnlocked(this.targetId())) {
        this.targetId.set(this.fallbackSystem(this.sourceId()));
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

  onInput(event: Event): void {
    this.input.set((event.target as HTMLInputElement).value);
  }

  openPicker(target: PickerTarget): void {
    this.picker.set(target);
  }

  closePicker(): void {
    this.picker.set(null);
  }

  /** Navigating while the sheet animates out leaves it presented, so wait for dismissal. */
  onPickerDismissed(): void {
    this.closePicker();
    if (this.paywallAfterDismiss) {
      this.paywallAfterDismiss = false;
      void this.router.navigate(['/paywall']);
    }
  }

  pick(id: NumberSystemId): void {
    if (!this.isUnlocked(id)) {
      this.paywallAfterDismiss = true;
      this.closePicker();
      return;
    }
    if (this.picker() === 'to') {
      this.targetId.set(id);
    } else {
      this.sourceId.set(id);
    }
    this.closePicker();
  }

  swap(): void {
    const result = this.result();
    const source = this.sourceId();
    this.sourceId.set(this.targetId());
    this.targetId.set(source);
    if (result !== null) {
      this.input.set(result);
    }
  }

  // Params are cleared after use so that opening the same value again re-emits.
  private applyQueryParams(params: ParamMap): void {
    const value = params.get('value');
    const from = params.get('from');
    if (!value || !isNumberSystemId(from) || !this.isUnlocked(from)) {
      return;
    }
    this.sourceId.set(from);
    this.input.set(value);
    if (this.targetId() === from) {
      this.targetId.set(from === 'decimal' ? 'binary' : 'decimal');
    }
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  private fallbackSystem(other: NumberSystemId): NumberSystemId {
    return this.systems.find((s) => s.id !== other && this.isUnlocked(s.id))?.id ?? 'decimal';
  }
}
