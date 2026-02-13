import type { TimePeriod } from '@coco/shared';

export interface DateRange {
  start: string; // YYYY-MM-DD inclusive
  end: string;   // YYYY-MM-DD exclusive
}

/**
 * Get the ISO week range (Mon–Sun) containing the given date.
 */
export function getWeekRange(date: string): DateRange {
  const d = new Date(date + 'T00:00:00');
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  return {
    start: formatISODate(monday),
    end: formatISODate(nextMonday),
  };
}

/**
 * Get the date range for a month string "YYYY-MM".
 */
export function getMonthRange(month: string): DateRange {
  const [year, mon] = month.split('-').map(Number);
  const start = `${year}-${String(mon).padStart(2, '0')}-01`;
  const end = mon === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(mon + 1).padStart(2, '0')}-01`;
  return { start, end };
}

/**
 * Get date range for a given period and reference date.
 * - daily: single day
 * - weekly: Mon–Sun containing date
 * - monthly: full calendar month containing date
 * - custom: user-supplied start/end (end is inclusive; converted to exclusive internally)
 */
export function getPeriodRange(
  period: TimePeriod,
  reference: string,
  customRange?: { start: string; end: string },
): DateRange {
  switch (period) {
    case 'daily': {
      const next = new Date(reference + 'T00:00:00');
      next.setDate(next.getDate() + 1);
      return { start: reference, end: formatISODate(next) };
    }
    case 'weekly':
      return getWeekRange(reference);
    case 'monthly': {
      const month = reference.slice(0, 7); // YYYY-MM
      return getMonthRange(month);
    }
    case 'custom': {
      if (!customRange) throw new Error('Custom period requires start and end dates');
      const endExclusive = new Date(customRange.end + 'T00:00:00');
      endExclusive.setDate(endExclusive.getDate() + 1);
      return { start: customRange.start, end: formatISODate(endExclusive) };
    }
  }
}

/**
 * Get the previous period's range for comparison.
 * For custom ranges, shifts back by the same duration.
 */
export function getPreviousPeriodRange(
  period: TimePeriod,
  reference: string,
  customRange?: { start: string; end: string },
): DateRange {
  switch (period) {
    case 'daily': {
      const prev = new Date(reference + 'T00:00:00');
      prev.setDate(prev.getDate() - 1);
      return getPeriodRange('daily', formatISODate(prev));
    }
    case 'weekly': {
      const prevWeek = new Date(reference + 'T00:00:00');
      prevWeek.setDate(prevWeek.getDate() - 7);
      return getWeekRange(formatISODate(prevWeek));
    }
    case 'monthly': {
      const [year, mon] = reference.slice(0, 7).split('-').map(Number);
      const prevMonth = mon === 1
        ? `${year - 1}-12`
        : `${year}-${String(mon - 1).padStart(2, '0')}`;
      return getMonthRange(prevMonth);
    }
    case 'custom': {
      if (!customRange) throw new Error('Custom period requires start and end dates');
      const startMs = new Date(customRange.start + 'T00:00:00').getTime();
      const endMs = new Date(customRange.end + 'T00:00:00').getTime();
      const durationMs = endMs - startMs + 86_400_000; // inclusive of end day
      const prevStart = new Date(startMs - durationMs);
      const prevEndExclusive = new Date(startMs); // current start becomes exclusive end
      return { start: formatISODate(prevStart), end: formatISODate(prevEndExclusive) };
    }
  }
}

/**
 * Enumerate each day within a date range as YYYY-MM-DD strings.
 */
export function enumerateDays(range: DateRange): string[] {
  const days: string[] = [];
  const current = new Date(range.start + 'T00:00:00');
  const end = new Date(range.end + 'T00:00:00');
  while (current < end) {
    days.push(formatISODate(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function formatISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}
