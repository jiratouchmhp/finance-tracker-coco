import { JSX } from 'react';
import { getToday, getCurrentMonth } from '../../utils/format';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

type PresetKey = 'today' | 'thisWeek' | 'thisMonth' | 'last30' | 'lastMonth';

interface Preset {
  key: PresetKey;
  label: string;
  getRange: () => { start: string; end: string };
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

const PRESETS: Preset[] = [
  {
    key: 'today',
    label: 'Today',
    getRange: () => {
      const today = getToday();
      return { start: today, end: today };
    },
  },
  {
    key: 'thisWeek',
    label: 'This Week',
    getRange: () => {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: toISODate(monday), end: toISODate(sunday) };
    },
  },
  {
    key: 'thisMonth',
    label: 'This Month',
    getRange: () => {
      const month = getCurrentMonth();
      const lastDay = new Date(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)),
        0,
      ).getDate();
      return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` };
    },
  },
  {
    key: 'last30',
    label: 'Last 30 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      return { start: toISODate(start), end: toISODate(end) };
    },
  },
  {
    key: 'lastMonth',
    label: 'Last Month',
    getRange: () => {
      const now = new Date();
      const firstOfCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastOfPrev = new Date(firstOfCurrent);
      lastOfPrev.setDate(0);
      const firstOfPrev = new Date(lastOfPrev.getFullYear(), lastOfPrev.getMonth(), 1);
      return { start: toISODate(firstOfPrev), end: toISODate(lastOfPrev) };
    },
  },
];

function detectActivePreset(startDate: string, endDate: string): PresetKey | null {
  for (const preset of PRESETS) {
    const range = preset.getRange();
    if (range.start === startDate && range.end === endDate) {
      return preset.key;
    }
  }
  return null;
}

export function DateRangeSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeSelectorProps): JSX.Element {
  const activePreset = detectActivePreset(startDate, endDate);

  function applyPreset(preset: Preset): void {
    const range = preset.getRange();
    onStartDateChange(range.start);
    onEndDateChange(range.end);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Quick presets */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activePreset === p.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date range inputs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-emerald-700">Date Range</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="border border-emerald-400 bg-emerald-50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <span className="text-sm text-gray-400">to</span>
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="border border-emerald-400 bg-emerald-50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        {startDate && endDate && endDate < startDate && (
          <span className="text-xs text-red-500">End date must be after start date</span>
        )}
      </div>
    </div>
  );
}
