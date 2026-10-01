import { Injectable, computed, inject, signal } from '@angular/core';
import { resolvePlan } from './plan';
import { SubscriptionGateway } from './subscription.gateway';
import {
  PurchaseOutcome,
  RestoreOutcome,
  SubscriptionOffer,
  SubscriptionSnapshot,
  SubscriptionStatus,
} from './subscription.types';

/**
 * The one canonical subscription state. The plan only ever comes from the
 * provider's customer info; failures keep the last resolved state so the app
 * keeps working offline.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly gateway = inject(SubscriptionGateway);
  private readonly entitlements = signal<readonly string[]>([]);
  private initializing: Promise<void> | null = null;

  readonly status = signal<SubscriptionStatus>('idle');
  readonly plan = computed(() => resolvePlan(this.entitlements()));
  readonly isSupported = computed(() => this.status() !== 'unavailable');

  initialize(): Promise<void> {
    this.initializing ??= this.start();
    return this.initializing;
  }

  async refresh(): Promise<void> {
    if (!this.gateway.isSupported()) {
      return;
    }
    try {
      this.apply(await this.gateway.refresh());
      this.status.set('ready');
    } catch {
      // Keep the last known plan.
    }
  }

  loadOffers(): Promise<readonly SubscriptionOffer[]> {
    return this.gateway.loadOffers();
  }

  async purchase(packageId: string): Promise<PurchaseOutcome> {
    try {
      const result = await this.gateway.purchase(packageId);
      if (result.kind === 'cancelled') {
        return { status: 'cancelled' };
      }
      this.apply(result.snapshot);
      return { status: 'purchased', plan: this.plan() };
    } catch (error) {
      return { status: 'error', message: messageOf(error) };
    }
  }

  async restore(): Promise<RestoreOutcome> {
    try {
      this.apply(await this.gateway.restore());
      return { status: 'restored', plan: this.plan() };
    } catch (error) {
      return { status: 'error', message: messageOf(error) };
    }
  }

  private async start(): Promise<void> {
    if (!this.gateway.isSupported()) {
      this.status.set('unavailable');
      return;
    }
    this.status.set('loading');
    try {
      this.apply(await this.gateway.initialize((snapshot) => this.apply(snapshot)));
      this.status.set('ready');
    } catch {
      this.status.set('error');
      this.initializing = null;
    }
  }

  private apply(snapshot: SubscriptionSnapshot): void {
    this.entitlements.set([...snapshot.activeEntitlements]);
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
}
