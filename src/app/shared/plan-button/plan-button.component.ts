import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PLAN_LABELS, SubscriptionCapabilities } from '../../core/subscription';

/** Header shortcut to the paywall: an upgrade call on Free, the current plan otherwise. */
@Component({
  selector: 'app-plan-button',
  template: `
    <button
      type="button"
      class="plan-button"
      [class.plan-button-upgrade]="isFree()"
      [attr.aria-label]="ariaLabel()"
      (click)="openPlans()"
    >
      @if (isFree()) {
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.9L22 9.6l-5.5 4.7L18.2 22 12 18.1 5.8 22l1.7-7.7L2 9.6l7.1-.7z"></path></svg>
      }
      {{ label() }}
    </button>
  `,
  styleUrls: ['plan-button.component.scss'],
})
export class PlanButtonComponent {
  private readonly router = inject(Router);
  private readonly capabilities = inject(SubscriptionCapabilities);

  readonly isFree = computed(() => this.capabilities.currentPlan() === 'free');
  readonly label = computed(() => (this.isFree() ? PLAN_LABELS.pro : PLAN_LABELS[this.capabilities.currentPlan()]));
  readonly ariaLabel = computed(() =>
    this.isFree() ? 'Upgrade to Pro' : `Current plan: ${this.label()}. See plans`,
  );

  openPlans(): void {
    void this.router.navigate(['/paywall']);
  }
}
