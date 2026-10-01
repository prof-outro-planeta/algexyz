import { Injectable } from '@angular/core';
import { DailyUsage, parseDailyUsage } from '../../domain/practice';

/**
 * Persistence boundary for the free daily practice counter. Swap the
 * implementation (Capacitor Preferences, Firestore, entitlements…) without
 * touching the page or the domain.
 */
@Injectable({ providedIn: 'root', useFactory: () => new LocalStorageDailyUsageStore() })
export abstract class DailyUsageStore {
  abstract load(): Promise<DailyUsage | null>;
  abstract save(usage: DailyUsage): Promise<void>;
}

export const DAILY_USAGE_STORAGE_KEY = 'algexyz.practice.dailyUsage';

export class LocalStorageDailyUsageStore extends DailyUsageStore {
  constructor(private readonly storage: Storage | undefined = globalThis.localStorage) {
    super();
  }

  async load(): Promise<DailyUsage | null> {
    try {
      const raw = this.storage?.getItem(DAILY_USAGE_STORAGE_KEY);
      return raw ? parseDailyUsage(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  async save(usage: DailyUsage): Promise<void> {
    try {
      this.storage?.setItem(DAILY_USAGE_STORAGE_KEY, JSON.stringify(usage));
    } catch {
      // Storage full or unavailable: the counter falls back to this session only.
    }
  }
}

/** In-memory store for tests. */
export class MemoryDailyUsageStore extends DailyUsageStore {
  constructor(public stored: DailyUsage | null = null) {
    super();
  }

  async load(): Promise<DailyUsage | null> {
    return this.stored;
  }

  async save(usage: DailyUsage): Promise<void> {
    this.stored = usage;
  }
}
