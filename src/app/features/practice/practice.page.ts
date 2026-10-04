import { Component, ElementRef, Injector, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, ViewWillEnter } from '@ionic/angular';
import { PLAN_LABELS, SubscriptionCapabilities } from '../../core/subscription';
import { explainConversion } from '../../domain/explanation';
import { NUMBER_SYSTEMS, getNumberSystem, invalidDigits, isValidNumeral } from '../../domain/number-system';
import {
  DailyUsage,
  PracticeQuestion,
  PracticeResult,
  emptyUsage,
  evaluateAnswer,
  generateQuestion,
  isLimitReached,
  localDateKey,
  recordActivity,
  usageForToday,
} from '../../domain/practice';
import { ConversionStepsComponent } from '../../shared/conversion-steps/conversion-steps.component';
import { PlanButtonComponent } from '../../shared/plan-button/plan-button.component';
import { DailyUsageStore } from './daily-usage.store';
import { PRACTICE_CLOCK, PRACTICE_RANDOM } from './practice.tokens';

/**
 * loading → question → answered (correct | incorrect) → next → question,
 * or → locked once the plan's daily activities are used up.
 */
export type PracticePhase = 'loading' | 'question' | 'answered' | 'locked';

@Component({
  selector: 'app-practice',
  templateUrl: 'practice.page.html',
  styleUrls: ['practice.page.scss'],
  imports: [IonHeader, IonToolbar, IonContent, ConversionStepsComponent, PlanButtonComponent],
})
export class PracticePage implements ViewWillEnter {
  private readonly store = inject(DailyUsageStore);
  private readonly random = inject(PRACTICE_RANDOM);
  private readonly now = inject(PRACTICE_CLOCK);
  private readonly injector = inject(Injector);
  private readonly feedback = viewChild<ElementRef<HTMLElement>>('feedback');
  private readonly page = viewChild<ElementRef<HTMLElement>>('page');
  private readonly router = inject(Router);
  private readonly capabilities = inject(SubscriptionCapabilities);

  readonly plan = this.capabilities.currentPlan;
  readonly planLabel = computed(() => PLAN_LABELS[this.plan()]);
  readonly limit = this.capabilities.dailyPracticeLimit;
  readonly unlimited = computed(() => !Number.isFinite(this.limit()));
  readonly progressSlots = computed(() =>
    this.unlimited() ? [] : Array.from({ length: this.limit() }, (_, i) => i),
  );

  readonly loaded = signal(false);
  readonly usage = signal<DailyUsage>(emptyUsage(this.today()));
  readonly question = signal<PracticeQuestion>(this.newQuestion());
  readonly answer = signal('');
  readonly selectedChoice = signal<string | null>(null);
  readonly result = signal<PracticeResult | null>(null);
  readonly explanationOpen = signal(false);

  readonly completed = computed(() => this.usage().completed);
  readonly limitReached = computed(() => isLimitReached(this.usage(), this.limit()));

  readonly phase = computed<PracticePhase>(() => {
    if (!this.loaded()) {
      return 'loading';
    }
    if (this.result()) {
      return 'answered';
    }
    return this.limitReached() ? 'locked' : 'question';
  });

  readonly source = computed(() => getNumberSystem(this.question().from));
  readonly target = computed(() => getNumberSystem(this.question().to));

  readonly inputMode = computed(() => (this.target().base <= 10 ? 'numeric' : 'text'));
  readonly validDigitsLabel = computed(() => [...this.target().digits].join(' '));

  readonly answerInvalidDigits = computed(() => {
    const raw = this.answer().trim();
    return raw ? invalidDigits(raw, this.target().base) : [];
  });

  readonly canSubmit = computed(
    () =>
      this.phase() === 'question' &&
      this.question().type === 'direct' &&
      isValidNumeral(this.answer(), this.target().base),
  );

  readonly explanation = computed(() => {
    const question = this.question();
    return explainConversion(question.numeral, this.source().base, this.target().base);
  });

  constructor() {
    void this.store.load().then((stored) => {
      this.usage.set(usageForToday(stored, this.today()));
      this.loaded.set(true);
    });
  }

  /** Tab pages stay alive; pick up a new calendar day when the user comes back. */
  ionViewWillEnter(): void {
    this.usage.update((usage) => usageForToday(usage, this.today()));
  }

  onAnswerInput(event: Event): void {
    this.answer.set((event.target as HTMLInputElement).value);
  }

  submit(): void {
    if (this.canSubmit()) {
      this.score(this.answer());
    }
  }

  choose(choice: string): void {
    if (this.phase() !== 'question' || this.question().type !== 'multiple-choice') {
      return;
    }
    this.selectedChoice.set(choice);
    this.score(choice);
  }

  toggleExplanation(): void {
    if (this.phase() === 'answered') {
      this.explanationOpen.update((open) => !open);
    }
  }

  next(): void {
    if (this.phase() !== 'answered') {
      return;
    }
    this.usage.update((usage) => usageForToday(usage, this.today()));
    // Also when locked: an upgrade must unlock a fresh, uncounted question.
    this.question.set(this.newQuestion());
    this.answer.set('');
    this.selectedChoice.set(null);
    this.explanationOpen.set(false);
    this.result.set(null);
    this.page()?.nativeElement.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  openPaywall(): void {
    void this.router.navigate(['/paywall']);
  }

  isCorrectChoice(choice: string): boolean {
    return this.phase() === 'answered' && choice === this.question().expectedAnswer;
  }

  isWrongPick(choice: string): boolean {
    return this.phase() === 'answered' && choice === this.selectedChoice() && !this.result()?.correct;
  }

  private score(raw: string): void {
    const question = this.question();
    this.result.set(evaluateAnswer(question, raw));

    const outcome = recordActivity(this.usage(), question.id, this.today(), this.limit());
    if (outcome.counted) {
      this.usage.set(outcome.usage);
      void this.store.save(outcome.usage);
    }
    this.revealFeedback();
  }

  /** Dismisses the on-screen keyboard and brings the feedback card into view. */
  private revealFeedback(): void {
    (document.activeElement as HTMLElement | null)?.blur();
    afterNextRender(
      () => this.feedback()?.nativeElement.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' }),
      { injector: this.injector },
    );
  }

  private newQuestion(): PracticeQuestion {
    const systems = NUMBER_SYSTEMS.filter((system) => this.capabilities.canUseBase(system.base));
    return generateQuestion({ random: this.random, systems });
  }

  private today(): string {
    return localDateKey(this.now());
  }
}
