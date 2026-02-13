/**
 * Format cents (satang) to display currency string.
 * Single source of truth for money display formatting.
 */
export function formatCurrency(cents: number): string {
  return `฿${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a date string to a readable format.
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current month as YYYY-MM.
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calculate percentage change between two values.
 */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

/**
 * Get the ISO week range label for a date (e.g. "Feb 9 – Feb 15, 2026").
 */
export function getWeekLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (dt: Date) =>
    dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

import type { TimePeriod } from '@coco/shared';

/**
 * Get a human-readable period label.
 * For custom ranges, pass the optional customRange parameter.
 */
export function getPeriodLabel(
  period: TimePeriod,
  ref: string,
  customRange?: { startDate: string; endDate: string },
): string {
  switch (period) {
    case 'daily':
      return formatDate(ref);
    case 'weekly':
      return getWeekLabel(ref);
    case 'monthly': {
      const d = new Date(ref + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    case 'custom': {
      if (!customRange?.startDate || !customRange?.endDate) return 'Select date range';
      const start = new Date(customRange.startDate + 'T00:00:00');
      const end = new Date(customRange.endDate + 'T00:00:00');
      const fmt = (d: Date) =>
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
    }
  }
}
