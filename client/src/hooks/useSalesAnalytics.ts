import { useState, useEffect, useCallback } from 'react';
import { salesApi } from '../services/api';
import type { TimePeriod, SalesAnalytics } from '@coco/shared';

export interface CustomRange {
  startDate: string;
  endDate: string;
}

export function useSalesAnalytics(
  period: TimePeriod,
  referenceDate: string,
  customRange?: CustomRange,
) {
  const [data, setData] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const startDate = customRange?.startDate ?? '';
  const endDate = customRange?.endDate ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let analytics: SalesAnalytics;
      if (period === 'custom') {
        if (!startDate || !endDate) {
          setLoading(false);
          return;
        }
        analytics = await salesApi.getCustomAnalytics(startDate, endDate);
      } else {
        analytics = await salesApi.getAnalytics(period, referenceDate);
      }
      setData(analytics);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sales analytics');
    } finally {
      setLoading(false);
    }
  }, [period, referenceDate, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
