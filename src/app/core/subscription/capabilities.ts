import { MAX_BASE, MIN_BASE } from '../../domain/number-system';
import { FREE_DAILY_ACTIVITIES } from '../../domain/practice';
import { PLANS, Feature, Plan } from './subscription.types';

export interface PlanCapabilities {
  readonly bases: ReadonlySet<number>;
  readonly features: ReadonlySet<Feature>;
  /** `Infinity` means no daily limit. */
  readonly dailyPracticeLimit: number;
}

const FREE_BASES = [2, 10, 16];
const PRO_BASES = [...FREE_BASES, 8, 12];
const ALL_BASES = Array.from({ length: MAX_BASE - MIN_BASE + 1 }, (_, i) => MIN_BASE + i);

const FREE_FEATURES: readonly Feature[] = ['converter', 'calculator', 'basic-explanations'];
const PRO_FEATURES: readonly Feature[] = [...FREE_FEATURES, 'fractions', 'twos-complement', 'additional-techniques'];
const PREMIUM_FEATURES: readonly Feature[] = [
  ...PRO_FEATURES,
  'arbitrary-bases',
  'advanced-techniques',
  'advanced-learning',
];

/** Single source of truth for what each plan unlocks. Each tier extends the one below. */
export const PLAN_CAPABILITIES: Readonly<Record<Plan, PlanCapabilities>> = {
  free: {
    bases: new Set(FREE_BASES),
    features: new Set(FREE_FEATURES),
    dailyPracticeLimit: FREE_DAILY_ACTIVITIES,
  },
  pro: {
    bases: new Set(PRO_BASES),
    features: new Set(PRO_FEATURES),
    dailyPracticeLimit: 20,
  },
  premium: {
    bases: new Set(ALL_BASES),
    features: new Set(PREMIUM_FEATURES),
    dailyPracticeLimit: Infinity,
  },
};

export function canUseBase(plan: Plan, base: number): boolean {
  return PLAN_CAPABILITIES[plan].bases.has(base);
}

export function canUseFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_CAPABILITIES[plan].features.has(feature);
}

export function dailyPracticeLimit(plan: Plan): number {
  return PLAN_CAPABILITIES[plan].dailyPracticeLimit;
}

/** Cheapest plan that unlocks the base, or `null` if no plan does. */
export function requiredPlanForBase(base: number): Plan | null {
  return PLANS.find((plan) => canUseBase(plan, base)) ?? null;
}

export function requiredPlanForFeature(feature: Feature): Plan | null {
  return PLANS.find((plan) => canUseFeature(plan, feature)) ?? null;
}
