export const FREE_DAILY_ACTIVITIES = 5;

export interface DailyUsage {
  /** Local calendar day, `YYYY-MM-DD`. */
  readonly date: string;
  readonly completed: number;
  /** Questions already counted today, so a question can never count twice. */
  readonly countedQuestionIds: readonly string[];
}

export interface RecordOutcome {
  readonly usage: DailyUsage;
  readonly counted: boolean;
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function emptyUsage(today: string): DailyUsage {
  return { date: today, completed: 0, countedQuestionIds: [] };
}

/** Stored usage from another day is discarded. */
export function usageForToday(stored: DailyUsage | null, today: string): DailyUsage {
  return stored && stored.date === today ? stored : emptyUsage(today);
}

export function isLimitReached(usage: DailyUsage, limit = FREE_DAILY_ACTIVITIES): boolean {
  return usage.completed >= limit;
}

export function recordActivity(
  stored: DailyUsage | null,
  questionId: string,
  today: string,
  limit = FREE_DAILY_ACTIVITIES,
): RecordOutcome {
  const usage = usageForToday(stored, today);
  if (usage.countedQuestionIds.includes(questionId) || isLimitReached(usage, limit)) {
    return { usage, counted: false };
  }
  return {
    usage: {
      date: today,
      completed: usage.completed + 1,
      countedQuestionIds: [...usage.countedQuestionIds, questionId],
    },
    counted: true,
  };
}

/** Validates data read back from storage; anything malformed is treated as no usage. */
export function parseDailyUsage(value: unknown): DailyUsage | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { date, completed, countedQuestionIds } = value as Record<string, unknown>;
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof completed !== 'number' ||
    !Number.isInteger(completed) ||
    completed < 0
  ) {
    return null;
  }
  const ids = Array.isArray(countedQuestionIds)
    ? countedQuestionIds.filter((id): id is string => typeof id === 'string')
    : [];
  return { date, completed, countedQuestionIds: ids };
}
