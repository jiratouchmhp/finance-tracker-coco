import { useState, useEffect, useCallback } from 'react';
import { salesApi, productApi } from '../services/api';
import type { Sale, Product, TimePeriod } from '@coco/shared';

interface SalesData {
  sales: Sale[];
  totalRevenueCents: number;
  totalCount: number;
  products: Product[];
}

export interface CustomRange {
  startDate: string;
  endDate: string;
}

export function useSalesData(
  period: TimePeriod,
  referenceDate: string,
  customRange?: CustomRange,
) {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const startDate = customRange?.startDate ?? '';
  const endDate = customRange?.endDate ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const productsData = await productApi.getAll();

      let sales: Sale[];
      let totalRevenueCents: number;
      let totalCount: number;

      switch (period) {
        case 'daily': {
          const dailySales = await salesApi.getByDate(referenceDate);
          sales = dailySales;
          totalRevenueCents = dailySales.reduce((sum, s) => sum + s.totalCents, 0);
          totalCount = dailySales.length;
          break;
        }
        case 'weekly': {
          const weekData = await salesApi.getByWeek(referenceDate);
          sales = weekData.sales;
          totalRevenueCents = weekData.totalRevenueCents;
          totalCount = weekData.totalCount;
          break;
        }
        case 'monthly': {
          const month = referenceDate.slice(0, 7);
          const monthData = await salesApi.getByMonth(month);
          sales = monthData.sales;
          totalRevenueCents = monthData.totalRevenueCents;
          totalCount = monthData.totalCount;
          break;
        }
        case 'custom': {
          if (!startDate || !endDate) {
            setLoading(false);
            return;
          }
          const rangeData = await salesApi.getByRange(startDate, endDate);
          sales = rangeData.sales;
          totalRevenueCents = rangeData.totalRevenueCents;
          totalCount = rangeData.totalCount;
          break;
        }
      }

      setData({ sales, totalRevenueCents, totalCount, products: productsData });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  }, [period, referenceDate, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
