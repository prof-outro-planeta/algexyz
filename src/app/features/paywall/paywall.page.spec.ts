import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Plan, SubscriptionService } from '../../core/subscription';
import { FakeSubscriptionGateway, provideFakeSubscription } from '../../core/subscription/subscription.testing';
import { PaywallPage } from './paywall.page';

describe('PaywallPage', () => {
  let component: PaywallPage;
  let fixture: ComponentFixture<PaywallPage>;
  let gateway: FakeSubscriptionGateway;

  async function setup(plan: Plan = 'free', configure?: (gateway: FakeSubscriptionGateway) => void): Promise<void> {
    const subscription = provideFakeSubscription(plan);
    gateway = subscription.gateway;
    configure?.(gateway);
    await TestBed.configureTestingModule({
      imports: [PaywallPage],
      providers: [provideRouter([]), ...subscription.providers],
    }).compileComponents();

    fixture = TestBed.createComponent(PaywallPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  function render(): HTMLElement {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function tier(plan: Plan): HTMLElement {
    return render().querySelector<HTMLElement>(`[data-plan="${plan}"]`)!;
  }

  it('compares the three plans with the localized prices from the store', async () => {
    await setup();

    expect(component.offersState()).toBe('ready');
    expect(tier('free').textContent).toContain('Binary · Decimal · Hexadecimal');
    expect(tier('free').textContent).toContain('Current plan');
    expect(tier('pro').textContent).toContain('$2.99');
    expect(tier('pro').textContent).toContain('/ month');
    expect(tier('premium').textContent).toContain('$5.99');
    expect(tier('premium').textContent).toContain('Any base from 2–36');
  });

  it('shows a loading state before prices arrive', async () => {
    const subscription = provideFakeSubscription('free');
    let release!: () => void;
    subscription.gateway.loadOffers = () =>
      new Promise((resolve) => (release = () => resolve(subscription.gateway.offers)));
    await TestBed.configureTestingModule({
      imports: [PaywallPage],
      providers: [provideRouter([]), ...subscription.providers],
    }).compileComponents();
    fixture = TestBed.createComponent(PaywallPage);
    component = fixture.componentInstance;
    await vi.waitFor(() => expect(release).toBeDefined());

    expect(render().textContent).toContain('Loading price…');
    expect(tier('pro').querySelector('button')?.disabled).toBe(true);

    release();
    await fixture.whenStable();
    expect(tier('pro').textContent).toContain('$2.99');
  });

  it('offers a retry when offerings fail', async () => {
    await setup('free', (g) => (g.failWith = new Error('offline')));

    expect(component.offersState()).toBe('error');
    expect(render().textContent).toContain("Couldn't load plans");

    gateway.failWith = null;
    await component.load();
    expect(component.offersState()).toBe('ready');
  });

  it('explains when subscriptions cannot run on this platform', async () => {
    await setup('free', (g) => (g.supported = false));
    const text = render().textContent ?? '';

    expect(component.offersState()).toBe('unavailable');
    expect(text).toContain('available in the ALGEXYZ Android app');
    expect(text).not.toContain('Subscribe to');
    expect(text).not.toContain('Restore purchases');
  });

  it('subscribes to a package and reflects the plan from customer info', async () => {
    await setup();

    await component.subscribe(component.offerFor('pro')!);
    const text = render().textContent ?? '';

    expect(TestBed.inject(SubscriptionService).plan()).toBe('pro');
    expect(text).toContain("You're on Pro.");
    expect(tier('pro').textContent).toContain('Current plan');
    expect(tier('premium').querySelector('button')?.textContent).toContain('Subscribe to Premium');
  });

  it('treats cancellation as a neutral outcome', async () => {
    await setup();
    gateway.cancelPurchase = true;

    await component.subscribe(component.offerFor('premium')!);

    expect(component.notice()).toEqual({ tone: 'neutral', text: 'Purchase cancelled. Nothing changed.' });
    expect(TestBed.inject(SubscriptionService).plan()).toBe('free');
  });

  it('reports purchase errors', async () => {
    await setup();
    gateway.failWith = new Error('Payment declined.');

    await component.subscribe(component.offerFor('pro')!);

    expect(component.notice()?.tone).toBe('error');
    expect(component.notice()?.text).toContain('Payment declined.');
  });

  it('warns instead of granting access when the store confirms no entitlement', async () => {
    await setup();
    gateway.nextEntitlements = [];

    await component.subscribe(component.offerFor('pro')!);

    expect(component.notice()?.tone).toBe('error');
    expect(TestBed.inject(SubscriptionService).plan()).toBe('free');
  });

  it('restores purchases with a clear result', async () => {
    await setup();
    gateway.nextEntitlements = ['premium'];

    await component.restore();

    expect(component.notice()?.text).toBe("Purchases restored. You're on Premium.");
    expect(tier('pro').textContent).toContain('Included in your plan');
  });

  it('says so when there is nothing to restore', async () => {
    await setup();

    await component.restore();

    expect(component.notice()).toEqual({ tone: 'neutral', text: 'No active subscription found for this account.' });
  });
});
