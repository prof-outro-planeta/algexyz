import { planIncludes, resolvePlan } from './plan';

describe('resolvePlan', () => {
  it('is free without entitlements', () => {
    expect(resolvePlan([])).toBe('free');
  });

  it('is pro when "pro" is active', () => {
    expect(resolvePlan(['pro'])).toBe('pro');
  });

  it('is premium when "premium" is active', () => {
    expect(resolvePlan(['premium'])).toBe('premium');
  });

  it('prefers premium when both are active', () => {
    expect(resolvePlan(['pro', 'premium'])).toBe('premium');
    expect(resolvePlan(['premium', 'pro'])).toBe('premium');
  });

  it('ignores unknown entitlements', () => {
    expect(resolvePlan(['beta_tester'])).toBe('free');
  });
});

describe('planIncludes', () => {
  it('orders plans free < pro < premium', () => {
    expect(planIncludes('premium', 'pro')).toBe(true);
    expect(planIncludes('pro', 'pro')).toBe(true);
    expect(planIncludes('pro', 'premium')).toBe(false);
    expect(planIncludes('free', 'pro')).toBe(false);
  });
});
