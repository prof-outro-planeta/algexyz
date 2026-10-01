import { Capacitor } from '@capacitor/core';
import {
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  Purchases,
  PurchasesError,
  PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { environment } from '../../../environments/environment';
import type { GatewayPurchaseResult, SubscriptionGateway } from './subscription.gateway';
import { PaidPlan, SubscriptionOffer, SubscriptionSnapshot } from './subscription.types';

const API_KEY_PLACEHOLDER = 'REVENUECAT_API_KEY';

/** Package identifiers in the RevenueCat "default" offering. */
const PACKAGE_PLANS: Readonly<Record<string, PaidPlan>> = {
  pro_monthly: 'pro',
  premium_monthly: 'premium',
};

/** Fallback when a package was created with a different identifier. */
const PRODUCT_PLANS: Readonly<Record<string, PaidPlan>> = {
  algexyz_pro_monthly: 'pro',
  algexyz_premium_monthly: 'premium',
};

const PERIOD_LABELS: Readonly<Record<string, string>> = {
  P1W: 'week',
  P1M: 'month',
  P3M: '3 months',
  P6M: '6 months',
  P1Y: 'year',
};

/** The only place in the app that talks to the RevenueCat SDK. */
export class RevenueCatSubscriptionGateway implements SubscriptionGateway {
  private readonly packages = new Map<string, PurchasesPackage>();
  private configured: Promise<void> | null = null;

  constructor(
    private readonly config = environment.revenueCat,
    private readonly isNative = () => Capacitor.isNativePlatform(),
  ) {}

  isSupported(): boolean {
    const key = this.config.apiKey.trim();
    return this.isNative() && key !== '' && key !== API_KEY_PLACEHOLDER;
  }

  async initialize(onChange: (snapshot: SubscriptionSnapshot) => void): Promise<SubscriptionSnapshot> {
    await this.configure();
    await Purchases.addCustomerInfoUpdateListener((info) => onChange(toSnapshot(info)));
    return this.refresh();
  }

  async refresh(): Promise<SubscriptionSnapshot> {
    await this.configure();
    const { customerInfo } = await Purchases.getCustomerInfo();
    return toSnapshot(customerInfo);
  }

  async loadOffers(): Promise<readonly SubscriptionOffer[]> {
    await this.configure();
    const offerings = await Purchases.getOfferings();
    const offering = offerings.current ?? offerings.all['default'] ?? null;

    this.packages.clear();
    const offers: SubscriptionOffer[] = [];
    for (const aPackage of offering?.availablePackages ?? []) {
      const plan = PACKAGE_PLANS[aPackage.identifier] ?? PRODUCT_PLANS[aPackage.product.identifier];
      if (!plan) {
        continue;
      }
      this.packages.set(aPackage.identifier, aPackage);
      offers.push({
        packageId: aPackage.identifier,
        plan,
        priceString: aPackage.product.priceString,
        period: periodLabel(aPackage.product.subscriptionPeriod),
      });
    }
    return offers;
  }

  async purchase(packageId: string): Promise<GatewayPurchaseResult> {
    await this.configure();
    const aPackage = this.packages.get(packageId);
    if (!aPackage) {
      throw new Error('This plan is no longer available. Reload and try again.');
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage });
      return { kind: 'purchased', snapshot: toSnapshot(customerInfo) };
    } catch (error) {
      if (isCancellation(error)) {
        return { kind: 'cancelled' };
      }
      throw toError(error);
    }
  }

  async restore(): Promise<SubscriptionSnapshot> {
    await this.configure();
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      return toSnapshot(customerInfo);
    } catch (error) {
      throw toError(error);
    }
  }

  private configure(): Promise<void> {
    if (!this.isSupported()) {
      return Promise.reject(new Error('Subscriptions are not available on this device.'));
    }
    this.configured ??= (async () => {
      if (this.config.debugLogs) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      }
      await Purchases.configure({ apiKey: this.config.apiKey });
    })().catch((error: unknown) => {
      this.configured = null;
      throw toError(error);
    });
    return this.configured;
  }
}

function toSnapshot(info: CustomerInfo): SubscriptionSnapshot {
  return { activeEntitlements: Object.keys(info.entitlements.active) };
}

function periodLabel(isoPeriod: string | null): string | null {
  return isoPeriod ? (PERIOD_LABELS[isoPeriod] ?? null) : null;
}

function isCancellation(error: unknown): boolean {
  const purchasesError = error as Partial<PurchasesError> | null;
  return purchasesError?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || purchasesError?.userCancelled === true;
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  const message = (error as Partial<PurchasesError> | null)?.message;
  return new Error(message || 'Unexpected subscription error.');
}
