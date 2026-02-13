import type { TimePeriod } from '@coco/shared';
import { getWeekLabel } from '../../utils/format';
import { JSX } from 'react';

interface PeriodSelectorProps {
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  referenceDate: string;
  onDateChange: (date: string) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
}

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function PeriodSelector({
  period,
  onPeriodChange,
  referenceDate,
  onDateChange,
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
}: PeriodSelectorProps): JSX.Element {
  const isCustom = period === 'custom';

  function handleStartChange(value: string): void {
    onStartDateChange?.(value);
    if (period !== 'custom') onPeriodChange('custom');
  }

  function handleEndChange(value: string): void {
    onEndDateChange?.(value);
    if (period !== 'custom') onPeriodChange('custom');
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Period toggles + single date input */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Period Toggle */}
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === p.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Single Date Input — active for non-custom periods */}
        <div className={`flex items-center gap-2 ${isCustom ? 'opacity-40 pointer-events-none' : ''}`}>
          <input
            type={period === 'monthly' ? 'month' : 'date'}
            value={period === 'monthly' ? referenceDate.slice(0, 7) : referenceDate}
            onChange={(e) => {
              const val = e.target.value;
              if (period === 'monthly') {
                onDateChange(val + '-01');
              } else {
                onDateChange(val);
              }
            }}
            disabled={isCustom}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
          />
          {period === 'weekly' && (
            <span className="text-sm text-gray-500 hidden sm:inline">
              {getWeekLabel(referenceDate)}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Custom date range inputs — always visible */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-sm font-medium ${isCustom ? 'text-emerald-700' : 'text-gray-500'}`}>
          Date Range
        </span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleStartChange(e.target.value)}
          className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
            isCustom ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300'
          }`}
          placeholder="Start date"
        />
        <span className="text-sm text-gray-400">to</span>
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => handleEndChange(e.target.value)}
          className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
            isCustom ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300'
          }`}
          placeholder="End date"
        />
        {isCustom && startDate && endDate && endDate < startDate && (
          <span className="text-xs text-red-500">End date must be after start date</span>
        )}
      </div>
    </div>
  );
}
