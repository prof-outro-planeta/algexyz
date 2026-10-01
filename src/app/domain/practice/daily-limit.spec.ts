import {
  FREE_DAILY_ACTIVITIES,
  emptyUsage,
  isLimitReached,
  localDateKey,
  parseDailyUsage,
  recordActivity,
  usageForToday,
} from './daily-limit';

describe('daily limit', () => {
  const today = '2026-10-01';
  const tomorrow = '2026-10-02';

  it('formats the local calendar day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });

  it('increments once per completed activity', () => {
    const first = recordActivity(null, 'q1', today);
    const second = recordActivity(first.usage, 'q2', today);

    expect(first.counted).toBe(true);
    expect(first.usage.completed).toBe(1);
    expect(second.usage.completed).toBe(2);
  });

  it('never counts the same question twice', () => {
    const first = recordActivity(null, 'q1', today);
    const again = recordActivity(first.usage, 'q1', today);

    expect(again.counted).toBe(false);
    expect(again.usage.completed).toBe(1);
  });

  it('stops counting at the free limit', () => {
    let usage = emptyUsage(today);
    for (let i = 0; i < FREE_DAILY_ACTIVITIES; i++) {
      usage = recordActivity(usage, `q${i}`, today).usage;
    }
    const extra = recordActivity(usage, 'extra', today);

    expect(isLimitReached(usage)).toBe(true);
    expect(extra.counted).toBe(false);
    expect(extra.usage.completed).toBe(FREE_DAILY_ACTIVITIES);
  });

  it('resets when the date changes', () => {
    const yesterday = { date: today, completed: FREE_DAILY_ACTIVITIES, countedQuestionIds: ['q1'] };

    expect(usageForToday(yesterday, tomorrow)).toEqual(emptyUsage(tomorrow));
    expect(recordActivity(yesterday, 'q1', tomorrow)).toEqual({
      usage: { date: tomorrow, completed: 1, countedQuestionIds: ['q1'] },
      counted: true,
    });
  });

  it('keeps usage from the same day', () => {
    const stored = { date: today, completed: 3, countedQuestionIds: ['a', 'b', 'c'] };

    expect(usageForToday(stored, today)).toBe(stored);
  });

  it('validates stored data', () => {
    expect(parseDailyUsage({ date: today, completed: 2, countedQuestionIds: ['a', 1] })).toEqual({
      date: today,
      completed: 2,
      countedQuestionIds: ['a'],
    });
    expect(parseDailyUsage(null)).toBeNull();
    expect(parseDailyUsage('2026-10-01')).toBeNull();
    expect(parseDailyUsage({ date: 'today', completed: 2 })).toBeNull();
    expect(parseDailyUsage({ date: today, completed: -1 })).toBeNull();
  });
});
