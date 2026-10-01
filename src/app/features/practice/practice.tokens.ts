import { InjectionToken } from '@angular/core';
import { RandomSource, defaultRandom } from '../../domain/practice';

export const PRACTICE_RANDOM = new InjectionToken<RandomSource>('PRACTICE_RANDOM', {
  providedIn: 'root',
  factory: () => defaultRandom,
});

export const PRACTICE_CLOCK = new InjectionToken<() => Date>('PRACTICE_CLOCK', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
