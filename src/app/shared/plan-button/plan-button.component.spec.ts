import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Plan, SubscriptionService } from '../../core/subscription';
import { entitlementsFor, provideFakeSubscription } from '../../core/subscription/subscription.testing';
import { PlanButtonComponent } from './plan-button.component';

describe('PlanButtonComponent', () => {
  async function setup(plan: Plan) {
    const fake = provideFakeSubscription(plan);
    await TestBed.configureTestingModule({
      imports: [PlanButtonComponent],
      providers: [provideRouter([]), ...fake.providers],
    }).compileComponents();
    await TestBed.inject(SubscriptionService).initialize();

    const fixture = TestBed.createComponent(PlanButtonComponent);
    fixture.detectChanges();
    const button = (): HTMLButtonElement => fixture.nativeElement.querySelector('button');
    return { fixture, gateway: fake.gateway, button };
  }

  it('invites free users to upgrade to Pro', async () => {
    const { button } = await setup('free');

    expect(button().textContent?.trim()).toBe('Pro');
    expect(button().getAttribute('aria-label')).toBe('Upgrade to Pro');
    expect(button().classList).toContain('plan-button-upgrade');
  });

  it('shows the current plan to subscribers', async () => {
    const { button } = await setup('premium');

    expect(button().textContent?.trim()).toBe('Premium');
    expect(button().getAttribute('aria-label')).toBe('Current plan: Premium. See plans');
    expect(button().classList).not.toContain('plan-button-upgrade');
  });

  it('follows plan changes', async () => {
    const { fixture, gateway, button } = await setup('free');

    gateway.emit(entitlementsFor('pro'));
    fixture.detectChanges();

    expect(button().getAttribute('aria-label')).toBe('Current plan: Pro. See plans');
  });

  it('opens the paywall', async () => {
    const { button } = await setup('free');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    button().click();

    expect(navigate).toHaveBeenCalledWith(['/paywall']);
  });
});
