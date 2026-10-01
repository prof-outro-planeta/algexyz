import { Injectable, computed, inject } from '@angular/core';
import * as rules from './capabilities';
import { SubscriptionService } from './subscription.service';
import { Feature, Plan } from './subscription.types';

/**
 * What the current user may do. Features ask this service, never the plan
 * or the billing provider directly. Methods read signals, so templates and
 * computeds that call them stay reactive.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionCapabilities {
  private readonly subscription = inject(SubscriptionService);

  readonly currentPlan = this.subscription.plan;
  readonly dailyPracticeLimit = computed(() => rules.dailyPracticeLimit(this.currentPlan()));

  canUseBase(base: number): boolean {
    return rules.canUseBase(this.currentPlan(), base);
  }

  canUseFeature(feature: Feature): boolean {
    return rules.canUseFeature(this.currentPlan(), feature);
  }

  getDailyPracticeLimit(): number {
    return this.dailyPracticeLimit();
  }

  requiredPlanForBase(base: number): Plan | null {
    return rules.requiredPlanForBase(base);
  }
}
