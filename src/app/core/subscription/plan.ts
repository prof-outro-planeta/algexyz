import { PLANS, Plan } from './subscription.types';

/** Entitlement identifiers configured in the RevenueCat dashboard. */
export const ENTITLEMENTS = {
  pro: 'pro',
  premium: 'premium',
} as const;

export function resolvePlan(activeEntitlements: readonly string[]): Plan {
  if (activeEntitlements.includes(ENTITLEMENTS.premium)) {
    return 'premium';
  }
  if (activeEntitlements.includes(ENTITLEMENTS.pro)) {
    return 'pro';
  }
  return 'free';
}

export function planIncludes(plan: Plan, required: Plan): boolean {
  return PLANS.indexOf(plan) >= PLANS.indexOf(required);
}
