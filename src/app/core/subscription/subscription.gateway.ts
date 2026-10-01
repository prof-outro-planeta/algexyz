import { Injectable } from '@angular/core';
import { RevenueCatSubscriptionGateway } from './revenuecat-subscription.gateway';
import { SubscriptionOffer, SubscriptionSnapshot } from './subscription.types';

export type GatewayPurchaseResult =
  | { readonly kind: 'purchased'; readonly snapshot: SubscriptionSnapshot }
  | { readonly kind: 'cancelled' };

/**
 * Port between the app and a billing provider. Implementations translate
 * store-specific objects into app types; nothing outside them should know
 * which provider is in use.
 */
@Injectable({ providedIn: 'root', useFactory: () => new RevenueCatSubscriptionGateway() })
export abstract class SubscriptionGateway {
  /** False when billing cannot run here (web build, missing API key). */
  abstract isSupported(): boolean;

  /** Configures the provider once and reports later changes through `onChange`. */
  abstract initialize(onChange: (snapshot: SubscriptionSnapshot) => void): Promise<SubscriptionSnapshot>;

  abstract refresh(): Promise<SubscriptionSnapshot>;

  abstract loadOffers(): Promise<readonly SubscriptionOffer[]>;

  /** Rejects on failure; user cancellation resolves as `cancelled`. */
  abstract purchase(packageId: string): Promise<GatewayPurchaseResult>;

  abstract restore(): Promise<SubscriptionSnapshot>;
}
