import {
  PLAN_CAPABILITIES,
  canUseBase,
  canUseFeature,
  dailyPracticeLimit,
  requiredPlanForBase,
  requiredPlanForFeature,
} from './capabilities';

describe('plan capabilities', () => {
  describe('free', () => {
    it('allows binary, decimal and hexadecimal only', () => {
      expect(canUseBase('free', 2)).toBe(true);
      expect(canUseBase('free', 10)).toBe(true);
      expect(canUseBase('free', 16)).toBe(true);
      expect(canUseBase('free', 8)).toBe(false);
      expect(canUseBase('free', 12)).toBe(false);
    });

    it('allows 5 practice activities per day', () => {
      expect(dailyPracticeLimit('free')).toBe(5);
    });

    it('keeps converter, calculator and basic explanations', () => {
      expect(canUseFeature('free', 'converter')).toBe(true);
      expect(canUseFeature('free', 'calculator')).toBe(true);
      expect(canUseFeature('free', 'basic-explanations')).toBe(true);
      expect(canUseFeature('free', 'fractions')).toBe(false);
    });
  });

  describe('pro', () => {
    it('adds octal and duodecimal but not arbitrary bases', () => {
      expect(canUseBase('pro', 8)).toBe(true);
      expect(canUseBase('pro', 12)).toBe(true);
      expect(canUseBase('pro', 3)).toBe(false);
      expect(canUseBase('pro', 36)).toBe(false);
      expect(canUseFeature('pro', 'arbitrary-bases')).toBe(false);
    });

    it('allows 20 practice activities per day', () => {
      expect(dailyPracticeLimit('pro')).toBe(20);
    });

    it('unlocks fractions, two’s complement and additional techniques', () => {
      expect(canUseFeature('pro', 'fractions')).toBe(true);
      expect(canUseFeature('pro', 'twos-complement')).toBe(true);
      expect(canUseFeature('pro', 'additional-techniques')).toBe(true);
      expect(canUseFeature('pro', 'advanced-techniques')).toBe(false);
    });
  });

  describe('premium', () => {
    it('allows every base from 2 to 36', () => {
      for (let base = 2; base <= 36; base++) {
        expect(canUseBase('premium', base)).toBe(true);
      }
      expect(canUseBase('premium', 1)).toBe(false);
      expect(canUseBase('premium', 37)).toBe(false);
    });

    it('has no daily practice limit', () => {
      expect(dailyPracticeLimit('premium')).toBe(Infinity);
    });

    it('includes every Pro capability', () => {
      for (const base of PLAN_CAPABILITIES.pro.bases) {
        expect(canUseBase('premium', base)).toBe(true);
      }
      for (const feature of PLAN_CAPABILITIES.pro.features) {
        expect(canUseFeature('premium', feature)).toBe(true);
      }
      expect(dailyPracticeLimit('premium')).toBeGreaterThan(dailyPracticeLimit('pro'));
    });
  });

  it('includes every Free capability in Pro', () => {
    for (const base of PLAN_CAPABILITIES.free.bases) {
      expect(canUseBase('pro', base)).toBe(true);
    }
    for (const feature of PLAN_CAPABILITIES.free.features) {
      expect(canUseFeature('pro', feature)).toBe(true);
    }
  });

  it('reports the cheapest plan that unlocks something', () => {
    expect(requiredPlanForBase(16)).toBe('free');
    expect(requiredPlanForBase(8)).toBe('pro');
    expect(requiredPlanForBase(20)).toBe('premium');
    expect(requiredPlanForBase(40)).toBeNull();
    expect(requiredPlanForFeature('twos-complement')).toBe('pro');
    expect(requiredPlanForFeature('arbitrary-bases')).toBe('premium');
  });
});
