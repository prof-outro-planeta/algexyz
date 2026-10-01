export type Plan = 'free' | 'pro' | 'premium';

export type PaidPlan = Exclude<Plan, 'free'>;

/** Ordered from least to most capable. */
export const PLANS: readonly Plan[] = ['free', 'pro', 'premium'];

export const PLAN_LABELS: Readonly<Record<Plan, string>> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
};

export type Feature =
  | 'converter'
  | 'calculator'
  | 'basic-explanations'
  | 'fractions'
  | 'twos-complement'
  | 'additional-techniques'
  | 'arbitrary-bases'
  | 'advanced-techniques'
  | 'advanced-learning';

/** Store-agnostic view of the subscriber, produced by a gateway. */
export interface SubscriptionSnapshot {
  readonly activeEntitlements: readonly string[];
}

/** A purchasable tier, with the localized price exactly as the store returned it. */
export interface SubscriptionOffer {
  readonly packageId: string;
  readonly plan: PaidPlan;
  readonly priceString: string;
  readonly period: string | null;
}

export type SubscriptionStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

export type PurchaseOutcome =
  | { readonly status: 'purchased'; readonly plan: Plan }
  | { readonly status: 'cancelled' }
  | { readonly status: 'error'; readonly message: string };

export type RestoreOutcome =
  | { readonly status: 'restored'; readonly plan: Plan }
  | { readonly status: 'error'; readonly message: string };
