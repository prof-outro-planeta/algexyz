import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonHeader, IonRouterOutlet, IonToolbar, NavController } from '@ionic/angular';
import {
  PLAN_LABELS,
  PaidPlan,
  Plan,
  SubscriptionOffer,
  SubscriptionService,
  planIncludes,
} from '../../core/subscription';

export type OffersState = 'loading' | 'ready' | 'error' | 'unavailable';

export interface PaywallNotice {
  readonly tone: 'success' | 'neutral' | 'error';
  readonly text: string;
  readonly canContinue?: boolean;
}

interface Tier {
  readonly plan: Plan;
  readonly tagline: string;
  readonly perks: readonly string[];
}

export const TIERS: readonly Tier[] = [
  {
    plan: 'free',
    tagline: 'The essentials',
    perks: ['Binary · Decimal · Hexadecimal', '5 practice activities/day', 'Basic explanations', 'Calculator'],
  },
  {
    plan: 'pro',
    tagline: 'More bases, more practice',
    perks: ['+ Octal', '+ Duodecimal', '20 practice activities/day', 'Fractions', "Two's complement"],
  },
  {
    plan: 'premium',
    tagline: 'No limits',
    perks: ['Any base from 2–36', 'Unlimited practice', 'Advanced conversion techniques', 'Everything in Pro'],
  },
];

const FALLBACK_ROUTE = '/tabs/converter';

@Component({
  selector: 'app-paywall',
  templateUrl: 'paywall.page.html',
  styleUrls: ['paywall.page.scss'],
  imports: [IonHeader, IonToolbar, IonContent],
})
export class PaywallPage {
  private readonly subscription = inject(SubscriptionService);
  private readonly nav = inject(NavController);
  private readonly outlet = inject(IonRouterOutlet, { optional: true });

  readonly tiers = TIERS;
  readonly labels = PLAN_LABELS;

  readonly plan = this.subscription.plan;
  readonly offersState = signal<OffersState>('loading');
  readonly offers = signal<readonly SubscriptionOffer[]>([]);
  readonly busy = signal<PaidPlan | 'restore' | null>(null);
  readonly notice = signal<PaywallNotice | null>(null);

  readonly canRestore = computed(() => this.offersState() !== 'unavailable' && this.busy() === null);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.offersState.set('loading');
    await this.subscription.initialize();
    if (this.subscription.status() === 'unavailable') {
      this.offersState.set('unavailable');
      return;
    }
    try {
      this.offers.set(await this.subscription.loadOffers());
      this.offersState.set('ready');
    } catch {
      this.offersState.set('error');
    }
  }

  offerFor(plan: Plan): SubscriptionOffer | null {
    return this.offers().find((offer) => offer.plan === plan) ?? null;
  }

  isCurrent(plan: Plan): boolean {
    return this.plan() === plan;
  }

  isIncluded(plan: Plan): boolean {
    return planIncludes(this.plan(), plan);
  }

  async subscribe(offer: SubscriptionOffer): Promise<void> {
    if (this.busy() !== null || this.isIncluded(offer.plan)) {
      return;
    }
    this.busy.set(offer.plan);
    this.notice.set(null);
    const outcome = await this.subscription.purchase(offer.packageId);
    this.busy.set(null);

    const label = PLAN_LABELS[offer.plan];
    switch (outcome.status) {
      case 'purchased':
        this.notice.set(
          planIncludes(outcome.plan, offer.plan)
            ? { tone: 'success', text: `You're on ${PLAN_LABELS[outcome.plan]}. Everything is unlocked.`, canContinue: true }
            : {
                tone: 'error',
                text: `The purchase went through, but ${label} isn't active yet. Try "Restore purchases" in a moment.`,
              },
        );
        break;
      case 'cancelled':
        this.notice.set({ tone: 'neutral', text: 'Purchase cancelled. Nothing changed.' });
        break;
      case 'error':
        this.notice.set({ tone: 'error', text: `Purchase failed. ${outcome.message}` });
        break;
    }
  }

  async restore(): Promise<void> {
    if (!this.canRestore()) {
      return;
    }
    this.busy.set('restore');
    this.notice.set(null);
    const outcome = await this.subscription.restore();
    this.busy.set(null);

    if (outcome.status === 'error') {
      this.notice.set({ tone: 'error', text: `Couldn't restore purchases. ${outcome.message}` });
    } else if (outcome.plan === 'free') {
      this.notice.set({ tone: 'neutral', text: 'No active subscription found for this account.' });
    } else {
      this.notice.set({
        tone: 'success',
        text: `Purchases restored. You're on ${PLAN_LABELS[outcome.plan]}.`,
        canContinue: true,
      });
    }
  }

  close(): void {
    if (this.outlet?.canGoBack()) {
      void this.nav.back();
    } else {
      void this.nav.navigateRoot(FALLBACK_ROUTE);
    }
  }
}
