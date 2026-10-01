import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Plan, SubscriptionService } from '../../core/subscription';
import { FakeSubscriptionGateway, provideFakeSubscription } from '../../core/subscription/subscription.testing';
import { DailyUsage, FREE_DAILY_ACTIVITIES, generateQuestion, seededRandom } from '../../domain/practice';
import { DailyUsageStore, MemoryDailyUsageStore } from './daily-usage.store';
import { PracticePage } from './practice.page';
import { PRACTICE_CLOCK, PRACTICE_RANDOM } from './practice.tokens';

describe('PracticePage', () => {
  let component: PracticePage;
  let fixture: ComponentFixture<PracticePage>;
  let store: MemoryDailyUsageStore;
  let now: Date;
  let gateway: FakeSubscriptionGateway;

  const direct = () => generateQuestion({ type: 'direct', from: 'binary', to: 'decimal', value: 45 });
  const multipleChoice = () =>
    generateQuestion({ type: 'multiple-choice', from: 'binary', to: 'hexadecimal', value: 45, random: seededRandom(1) });

  async function setup(stored: DailyUsage | null = null, plan: Plan = 'free'): Promise<void> {
    store = new MemoryDailyUsageStore(stored);
    now = new Date(2026, 9, 1, 10, 0);
    const subscription = provideFakeSubscription(plan);
    gateway = subscription.gateway;

    await TestBed.configureTestingModule({
      imports: [PracticePage],
      providers: [
        provideRouter([]),
        ...subscription.providers,
        { provide: DailyUsageStore, useValue: store },
        { provide: PRACTICE_CLOCK, useValue: () => now },
        { provide: PRACTICE_RANDOM, useValue: seededRandom(11) },
      ],
    }).compileComponents();
    await TestBed.inject(SubscriptionService).initialize();

    fixture = TestBed.createComponent(PracticePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function render(): HTMLElement {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function typeAnswer(value: string): void {
    const input = render().querySelector<HTMLInputElement>('#practice-answer')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  describe('fresh day', () => {
    beforeEach(() => setup());

    it('loads usage and shows today’s progress', () => {
      expect(component.phase()).toBe('question');
      expect(render().querySelector('.progress')?.textContent).toContain(`0 / ${FREE_DAILY_ACTIVITIES}`);
    });

    it('scores a correct direct answer and counts one activity', () => {
      component.question.set(direct());
      typeAnswer('45');
      component.submit();
      const text = render().textContent ?? '';

      expect(component.phase()).toBe('answered');
      expect(component.result()?.correct).toBe(true);
      expect(text).toContain('Correct!');
      expect(component.completed()).toBe(1);
      expect(store.stored?.completed).toBe(1);
    });

    it('shows the user answer and the correct answer when wrong', () => {
      component.question.set(direct());
      typeAnswer('44');
      component.submit();
      const text = render().textContent ?? '';

      expect(text).toContain('Not quite.');
      expect(text).toContain('Your answer');
      expect(text).toContain('44');
      expect(text).toContain('Correct answer');
      expect(text).toContain('45');
    });

    it('cannot submit twice or change a scored answer', () => {
      component.question.set(direct());
      typeAnswer('44');
      component.submit();
      typeAnswer('45');
      component.submit();

      expect(component.result()?.correct).toBe(false);
      expect(component.completed()).toBe(1);
    });

    it('does not submit an empty or invalid answer', () => {
      component.question.set(direct());
      typeAnswer('4A');
      component.submit();

      expect(component.phase()).toBe('question');
      expect(component.completed()).toBe(0);
      expect(render().querySelector('#practice-answer-hint')?.textContent).toContain('A not in base 10');
    });

    it('scores a multiple-choice pick once', () => {
      const question = multipleChoice();
      component.question.set(question);
      const wrong = question.choices.find((choice) => choice !== '2D')!;

      component.choose(wrong);
      component.choose('2D');

      expect(component.result()?.correct).toBe(false);
      expect(component.selectedChoice()).toBe(wrong);
      expect(component.completed()).toBe(1);
      const correctButton = render().querySelector('.choice-correct');
      expect(correctButton?.textContent).toContain('2D');
      expect(correctButton?.textContent).toContain('Correct');
    });

    it('keeps the question until feedback was shown, then moves on', () => {
      const question = direct();
      component.question.set(question);
      component.next();
      expect(component.question()).toBe(question);

      typeAnswer('45');
      component.submit();
      component.next();

      expect(component.question()).not.toBe(question);
      expect(component.phase()).toBe('question');
      expect(component.answer()).toBe('');
      expect(component.result()).toBeNull();
    });

    it('reuses the structured conversion explanation', () => {
      component.question.set(multipleChoice());
      component.choose('2D');
      component.toggleExplanation();
      const element = render();

      expect(element.querySelector('app-conversion-steps')).not.toBeNull();
      const groups = [...element.querySelectorAll('.bit-group-digit')].map((g) => g.textContent?.trim());
      expect(groups).toEqual(['2', 'D']);
    });

    it('only opens the explanation after answering', () => {
      component.toggleExplanation();
      expect(component.explanationOpen()).toBe(false);
    });
  });

  describe('daily limit', () => {
    it('locks after the fifth activity, but only once feedback is dismissed', async () => {
      await setup({ date: '2026-10-01', completed: 4, countedQuestionIds: ['a', 'b', 'c', 'd'] });
      component.question.set(direct());
      typeAnswer('45');
      component.submit();

      expect(component.phase()).toBe('answered');
      expect(component.completed()).toBe(FREE_DAILY_ACTIVITIES);

      component.next();
      const text = render().textContent ?? '';
      expect(component.phase()).toBe('locked');
      expect(text).toContain('Daily practice complete');
      expect(text).toContain("You've completed today's 5 free activities.");
      expect(render().querySelector('.locked .btn')?.textContent).toContain('Go Pro');
    });

    it('starts locked when today’s activities are already used', async () => {
      await setup({ date: '2026-10-01', completed: 5, countedQuestionIds: [] });

      expect(component.phase()).toBe('locked');
      expect(render().querySelector('#practice-answer')).toBeNull();
    });

    it('ignores usage stored on a previous day', async () => {
      await setup({ date: '2026-09-30', completed: 5, countedQuestionIds: [] });

      expect(component.phase()).toBe('question');
      expect(component.completed()).toBe(0);
    });

    it('opens the paywall from the locked state', async () => {
      await setup({ date: '2026-10-01', completed: 5, countedQuestionIds: [] });
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      render().querySelector<HTMLButtonElement>('.locked .btn')!.click();

      expect(navigate).toHaveBeenCalledWith(['/paywall']);
    });

    it('keeps today’s usage and unlocks immediately when upgrading to Pro', async () => {
      await setup({ date: '2026-10-01', completed: 5, countedQuestionIds: [] });
      expect(component.phase()).toBe('locked');

      gateway.emit(['pro']);

      expect(component.phase()).toBe('question');
      expect(component.completed()).toBe(5);
      expect(render().querySelector('.progress')?.textContent).toContain('5 / 20');
    });

    it('locks a Pro user at 20 and offers Premium', async () => {
      await setup({ date: '2026-10-01', completed: 20, countedQuestionIds: [] }, 'pro');
      const text = render().textContent ?? '';

      expect(component.phase()).toBe('locked');
      expect(text).toContain("You've completed today's 20 Pro activities.");
      expect(text).toContain('Go Premium');
    });

    it('removes the daily limit for Premium', async () => {
      await setup({ date: '2026-10-01', completed: 25, countedQuestionIds: [] }, 'premium');

      expect(component.phase()).toBe('question');
      expect(render().querySelector('.progress')?.textContent).toContain('25 · Unlimited');
      expect(render().querySelector('.progress-bar')).toBeNull();
    });

    it('only asks about bases the plan includes', async () => {
      await setup();
      for (let i = 0; i < 30; i++) {
        const question = component.question();
        expect(['binary', 'decimal', 'hexadecimal']).toContain(question.from);
        expect(['binary', 'decimal', 'hexadecimal']).toContain(question.to);
        component.question.set(generateQuestion({ type: 'direct', from: 'binary', to: 'decimal', value: 45 + i }));
        typeAnswer(String(45 + i));
        component.submit();
        component.next();
        if (component.phase() === 'locked') {
          break;
        }
      }
    });

    it('resets when the date changes while the tab stays open', async () => {
      await setup({ date: '2026-10-01', completed: 5, countedQuestionIds: [] });
      now = new Date(2026, 9, 2, 8, 0);
      component.ionViewWillEnter();

      expect(component.phase()).toBe('question');
      expect(component.usage().date).toBe('2026-10-02');
    });
  });
});
