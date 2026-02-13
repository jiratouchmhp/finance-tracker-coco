import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../services/api';
import type { DashboardDaily, DashboardWeekly, DashboardMonthly, DashboardCustomRange, TimePeriod } from '@coco/shared';

/** Normalized shape returned by the hook regardless of period. */
export interface DashboardData {
  totalRevenueCents: number;
  totalCogsCents: number;
  totalLaborCents: number;
  totalOtherExpensesCents: number;
  netProfitCents: number;
  salesCount: number;
  topProducts: Array<{ productName: string; quantity: number; totalCents: number }>;
  fraudAlertCount: number;
  periodLabel: string;
}

function normalizeDaily(d: DashboardDaily): DashboardData {
  return {
    totalRevenueCents: d.totalRevenueCents,
    totalCogsCents: d.totalCogsCents,
    totalLaborCents: d.totalLaborCents,
    totalOtherExpensesCents: d.totalOtherExpensesCents,
    netProfitCents: d.netProfitCents,
    salesCount: d.salesCount,
    topProducts: d.topProducts,
    fraudAlertCount: d.fraudAlertCount,
    periodLabel: d.date,
  };
}

function normalizeWeekly(d: DashboardWeekly): DashboardData {
  return {
    totalRevenueCents: d.totalRevenueCents,
    totalCogsCents: d.totalCogsCents,
    totalLaborCents: d.totalLaborCents,
    totalOtherExpensesCents: d.totalOtherExpensesCents,
    netProfitCents: d.netProfitCents,
    salesCount: d.salesCount,
    topProducts: d.topProducts,
    fraudAlertCount: d.fraudAlertCount,
    periodLabel: `${d.weekStart} to ${d.weekEnd}`,
  };
}

function normalizeMonthly(d: DashboardMonthly): DashboardData {
  const totalOtherExpensesCents = d.totalUtilityCents + d.totalOtherExpensesCents;
  return {
    totalRevenueCents: d.totalRevenueCents,
    totalCogsCents: d.totalCogsCents,
    totalLaborCents: d.totalLaborCents,
    totalOtherExpensesCents,
    netProfitCents: d.netProfitCents,
    salesCount: d.dailySummaries.reduce((sum, ds) => sum + ds.salesCount, 0),
    topProducts: [], // monthly endpoint doesn't include topProducts; will use analytics
    fraudAlertCount: 0,
    periodLabel: d.month,
  };
}

function normalizeCustomRange(d: DashboardCustomRange): DashboardData {
  return {
    totalRevenueCents: d.totalRevenueCents,
    totalCogsCents: d.totalCogsCents,
    totalLaborCents: d.totalLaborCents,
    totalOtherExpensesCents: d.totalOtherExpensesCents,
    netProfitCents: d.netProfitCents,
    salesCount: d.salesCount,
    topProducts: d.topProducts,
    fraudAlertCount: d.fraudAlertCount,
    periodLabel: `${d.startDate} to ${d.endDate}`,
  };
}

export interface CustomRange {
  startDate: string;
  endDate: string;
}

export function useDashboard(
  period: TimePeriod,
  referenceDate: string,
  customRange?: CustomRange,
) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const startDate = customRange?.startDate ?? '';
  const endDate = customRange?.endDate ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let result: DashboardData;
      switch (period) {
        case 'daily': {
          const daily = await dashboardApi.getDaily(referenceDate);
          result = normalizeDaily(daily);
          break;
        }
        case 'weekly': {
          const weekly = await dashboardApi.getWeekly(referenceDate);
          result = normalizeWeekly(weekly);
          break;
        }
        case 'monthly': {
          const month = referenceDate.slice(0, 7);
          const monthly = await dashboardApi.getMonthly(month);
          result = normalizeMonthly(monthly);
          break;
        }
        case 'custom': {
          if (!startDate || !endDate) {
            setLoading(false);
            return;
          }
          const custom = await dashboardApi.getCustomRange(startDate, endDate);
          result = normalizeCustomRange(custom);
          break;
        }
      }
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [period, referenceDate, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
