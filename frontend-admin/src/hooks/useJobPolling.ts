// frontend-admin/src/hooks/useJobPolling.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect, useRef, useCallback } from 'react';
import { certificationApi, JobStatus } from '../services/certificationApi';
import { logger } from '../utils/logger';

interface UseJobPollingOptions {
  interval?: number; // Intervalo de polling em ms (padrão: 3000)
  enabled?: boolean; // Se o polling está ativo
  onJobCompleted?: (job: JobStatus) => void; // Callback quando job completa
  onJobFailed?: (job: JobStatus) => void; // Callback quando job falha
}

interface UseJobPollingResult {
  jobs: JobStatus[];
  isPolling: boolean;
  lastUpdate: Date | null;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook para polling automático de jobs de certificação
 * Monitora jobs ativos (QUEUED ou PROCESSING) e atualiza automaticamente
 * Para quando todos os jobs estão concluídos (COMPLETED ou FAILED)
 */
export function useJobPolling(
  jobIds: string[],
  options: UseJobPollingOptions = {}
): UseJobPollingResult {
  const { interval = 3000, enabled = true, onJobCompleted, onJobFailed } = options;

  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const previousJobsRef = useRef<Map<string, string>>(new Map()); // Armazena status anterior dos jobs

  // Função para buscar status dos jobs
  const fetchJobsStatus = useCallback(async () => {
    if (jobIds.length === 0) {
      logger.debug('No job IDs to poll', { component: 'useJobPolling' });
      return;
    }

    try {
      logger.debug('Fetching job status', {
        component: 'useJobPolling',
        jobIds,
        count: jobIds.length
      });

      // Buscar status de cada job
      const jobPromises = jobIds.map(id => certificationApi.getJobStatus(id));
      const jobsData = await Promise.all(jobPromises);

      if (!isMountedRef.current) return;

      // Detectar mudanças de status
      jobsData.forEach(job => {
        const previousStatus = previousJobsRef.current.get(job.id);
        
        // Só notificar se o job estava em processamento antes
        if (previousStatus === 'PROCESSING' || previousStatus === 'QUEUED') {
          if (job.status === 'COMPLETED' && onJobCompleted) {
            logger.info('Job completed - triggering callback', {
              component: 'useJobPolling',
              jobId: job.id,
              previousStatus,
              newStatus: job.status
            });
            onJobCompleted(job);
          } else if (job.status === 'FAILED' && onJobFailed) {
            logger.error('Job failed - triggering callback', {
              component: 'useJobPolling',
              jobId: job.id,
              previousStatus,
              newStatus: job.status
            });
            onJobFailed(job);
          }
        }
        
        // Atualizar status anterior
        previousJobsRef.current.set(job.id, job.status);
      });

      setJobs(jobsData);
      setLastUpdate(new Date());
      setError(null);

      logger.info('Job status updated', {
        component: 'useJobPolling',
        jobCount: jobsData.length,
        statuses: jobsData.map(j => j.status)
      });

      // Verificar se há jobs ativos
      const hasActiveJobs = jobsData.some(
        job => job.status === 'QUEUED' || job.status === 'PROCESSING'
      );

      // Parar polling se não há jobs ativos
      if (!hasActiveJobs && isPolling) {
        logger.info('All jobs completed, stopping polling', {
          component: 'useJobPolling',
          jobIds
        });
        setIsPolling(false);
      }

      return hasActiveJobs;
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job status';
      setError(errorMessage);
      
      logger.error('Failed to fetch job status', {
        component: 'useJobPolling',
        error: errorMessage,
        jobIds
      });

      return false;
    }
  }, [jobIds, isPolling, onJobCompleted, onJobFailed]);

  // Função para refresh manual
  const refresh = useCallback(async () => {
    logger.info('Manual refresh triggered', { component: 'useJobPolling' });
    await fetchJobsStatus();
  }, [fetchJobsStatus]);

  // Iniciar polling quando há jobs e está habilitado
  useEffect(() => {
    if (!enabled || jobIds.length === 0) {
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Buscar imediatamente
    fetchJobsStatus().then(hasActiveJobs => {
      if (!hasActiveJobs) {
        logger.debug('No active jobs, polling not started', {
          component: 'useJobPolling'
        });
        return;
      }

      // Iniciar polling apenas se há jobs ativos
      setIsPolling(true);
      
      logger.info('Starting job polling', {
        component: 'useJobPolling',
        interval,
        jobIds
      });

      intervalRef.current = setInterval(() => {
        fetchJobsStatus();
      }, interval);
    });

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        logger.debug('Polling stopped (cleanup)', { component: 'useJobPolling' });
      }
    };
  }, [jobIds, enabled, interval, fetchJobsStatus]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    jobs,
    isPolling,
    lastUpdate,
    error,
    refresh
  };
}
