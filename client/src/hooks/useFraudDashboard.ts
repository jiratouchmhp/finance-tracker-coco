import { useState, useEffect, useCallback } from 'react';
import { fraudApi } from '../services/api';
import type { FraudDashboard } from '@coco/shared';

export function useFraudDashboard(days: number = 30) {
  const [data, setData] = useState<FraudDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (days <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const dashboard = await fraudApi.getDashboard(days);
      setData(dashboard);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load fraud data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
