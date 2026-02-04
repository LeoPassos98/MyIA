// frontend-admin/src/hooks/useStats.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect } from 'react';
import { certificationApi, Stats } from '../services/certificationApi';
import { logger } from '../utils/logger';

export function useStats(refreshInterval = 10000) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await certificationApi.getStats();
      logger.debug('Stats fetched', { hasData: !!data, queueStats: data?.queue });
      setStats(data);
      setError(null);
    } catch (err: any) {
      logger.error('Error fetching stats', { error: err.message });
      setError(err.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { stats, loading, error, refetch: fetchStats };
}
