import { TestBed } from '@angular/core/testing';
import { SubscriptionCapabilities } from './subscription-capabilities.service';
import { SubscriptionService } from './subscription.service';
import { FakeSubscriptionGateway, provideFakeSubscription } from './subscription.testing';
import { Plan } from './subscription.types';

describe('SubscriptionService', () => {
  let gateway: FakeSubscriptionGateway;
  let service: SubscriptionService;
  let capabilities: SubscriptionCapabilities;

  function setup(plan: Plan = 'free'): void {
    const fake = provideFakeSubscription(plan);
    gateway = fake.gateway;
    TestBed.configureTestingModule({ providers: fake.providers });
    service = TestBed.inject(SubscriptionService);
    capabilities = TestBed.inject(SubscriptionCapabilities);
  }

  it('starts free and resolves the plan from customer info', async () => {
    setup('pro');
    expect(service.plan()).toBe('free');

    await service.initialize();

    expect(service.status()).toBe('ready');
    expect(service.plan()).toBe('pro');
    expect(capabilities.canUseBase(8)).toBe(true);
    expect(capabilities.getDailyPracticeLimit()).toBe(20);
  });

  it('is unavailable where billing cannot run, and stays free', async () => {
    setup();
    gateway.supported = false;

    await service.initialize();

    expect(service.status()).toBe('unavailable');
    expect(service.plan()).toBe('free');
    expect(capabilities.canUseBase(16)).toBe(true);
  });

  it('follows customer info updates pushed by the provider', async () => {
    setup();
    await service.initialize();

    gateway.emit(['premium']);

    expect(service.plan()).toBe('premium');
    expect(capabilities.getDailyPracticeLimit()).toBe(Infinity);
  });

  it('upgrades only from the customer info returned by a purchase', async () => {
    setup();
    await service.initialize();

    expect(await service.purchase('premium_monthly')).toEqual({ status: 'purchased', plan: 'premium' });
    expect(service.plan()).toBe('premium');
  });

  it('does not grant anything the provider did not confirm', async () => {
    setup();
    await service.initialize();
    gateway.nextEntitlements = [];

    expect(await service.purchase('pro_monthly')).toEqual({ status: 'purchased', plan: 'free' });
    expect(service.plan()).toBe('free');
  });

  it('reports cancellation separately from errors', async () => {
    setup();
    await service.initialize();
    gateway.cancelPurchase = true;

    expect(await service.purchase('pro_monthly')).toEqual({ status: 'cancelled' });
  });

  it('reports purchase errors and keeps the current plan', async () => {
    setup('pro');
    await service.initialize();
    gateway.failWith = new Error('Store unavailable');

    expect(await service.purchase('premium_monthly')).toEqual({ status: 'error', message: 'Store unavailable' });
    expect(service.plan()).toBe('pro');
  });

  it('restores purchases into the plan', async () => {
    setup();
    await service.initialize();
    gateway.nextEntitlements = ['pro'];

    expect(await service.restore()).toEqual({ status: 'restored', plan: 'pro' });
    expect(service.plan()).toBe('pro');
  });

  it('keeps the last known plan when a refresh fails', async () => {
    setup('premium');
    await service.initialize();
    gateway.failWith = new Error('offline');

    await service.refresh();

    expect(service.plan()).toBe('premium');
  });

  it('marks a failed start as error, stays free, and can retry', async () => {
    setup('pro');
    gateway.failWith = new Error('offline');

    await service.initialize();
    expect(service.status()).toBe('error');
    expect(service.plan()).toBe('free');

    gateway.failWith = null;
    await service.initialize();
    expect(service.plan()).toBe('pro');
  });
});
