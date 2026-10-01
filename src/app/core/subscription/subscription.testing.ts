import { Provider } from '@angular/core';
import { ENTITLEMENTS } from './plan';
import { GatewayPurchaseResult, SubscriptionGateway } from './subscription.gateway';
import { Plan, SubscriptionOffer, SubscriptionSnapshot } from './subscription.types';

export function entitlementsFor(plan: Plan): string[] {
  return plan === 'free' ? [] : [ENTITLEMENTS[plan]];
}

/** In-memory gateway for unit tests; no network, no native plugin. */
export class FakeSubscriptionGateway extends SubscriptionGateway {
  supported = true;
  offers: SubscriptionOffer[] = [
    { packageId: 'pro_monthly', plan: 'pro', priceString: '$2.99', period: 'month' },
    { packageId: 'premium_monthly', plan: 'premium', priceString: '$5.99', period: 'month' },
  ];
  /** Entitlements granted by `purchase`/`restore`; unset means use the package's plan. */
  nextEntitlements: string[] | null = null;
  failWith: Error | null = null;
  cancelPurchase = false;
  private listener: ((snapshot: SubscriptionSnapshot) => void) | null = null;

  constructor(private active: string[] = []) {
    super();
  }

  isSupported(): boolean {
    return this.supported;
  }

  async initialize(onChange: (snapshot: SubscriptionSnapshot) => void): Promise<SubscriptionSnapshot> {
    this.listener = onChange;
    return this.refresh();
  }

  async refresh(): Promise<SubscriptionSnapshot> {
    this.throwIfFailing();
    return { activeEntitlements: this.active };
  }

  async loadOffers(): Promise<readonly SubscriptionOffer[]> {
    this.throwIfFailing();
    return this.offers;
  }

  async purchase(packageId: string): Promise<GatewayPurchaseResult> {
    this.throwIfFailing();
    if (this.cancelPurchase) {
      return { kind: 'cancelled' };
    }
    const offer = this.offers.find((o) => o.packageId === packageId);
    this.active = this.nextEntitlements ?? (offer ? entitlementsFor(offer.plan) : this.active);
    return { kind: 'purchased', snapshot: { activeEntitlements: this.active } };
  }

  async restore(): Promise<SubscriptionSnapshot> {
    this.throwIfFailing();
    this.active = this.nextEntitlements ?? this.active;
    return { activeEntitlements: this.active };
  }

  /** Simulates the provider pushing a customer info update. */
  emit(activeEntitlements: string[]): void {
    this.active = activeEntitlements;
    this.listener?.({ activeEntitlements });
  }

  private throwIfFailing(): void {
    if (this.failWith) {
      throw this.failWith;
    }
  }
}

/** Provides a fake gateway already holding `plan`; call `SubscriptionService.initialize()` to load it. */
export function provideFakeSubscription(plan: Plan = 'free'): { gateway: FakeSubscriptionGateway; providers: Provider[] } {
  const gateway = new FakeSubscriptionGateway(entitlementsFor(plan));
  return { gateway, providers: [{ provide: SubscriptionGateway, useValue: gateway }] };
}
