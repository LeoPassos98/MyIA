// frontend-admin/src/components/Certifications/useJobHistory.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { certificationApi, JobStatus } from '../../services/certificationApi';
import { useJobPolling } from '../../hooks/useJobPolling';
import { useNotification } from '../../hooks/useNotification';
import { logger } from '../../utils/logger';

/**
 * Hook que encapsula toda a lógica de negócio do JobHistoryTable
 * Separação View/Logic conforme STANDARDS.md Seção 3.0
 */
export function useJobHistory() {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Estados para filtros
  const [searchId, setSearchId] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Estados para expansão de linhas
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { showSuccess, showError } = useNotification();

  // Callbacks para notificações de mudança de status
  const handleJobCompleted = useCallback((job: JobStatus) => {
    const jobIdShort = job.id.substring(0, 8);
    const processedModels = job.processedModels || 0;
    const totalModels = job.totalModels || 0;
    
    // Calcular tempo decorrido
    const startTime = new Date(job.createdAt).getTime();
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationMin = Math.floor(durationMs / 60000);
    const durationSec = Math.floor((durationMs % 60000) / 1000);
    const duration = durationMin > 0 
      ? `${durationMin}m ${durationSec}s` 
      : `${durationSec}s`;

    const message = `✅ Job #${jobIdShort} concluído! ${processedModels}/${totalModels} modelos processados em ${duration}`;
    
    showSuccess(message);
    
    logger.info('Job completion notification shown', {
      component: 'JobHistoryTable',
      jobId: job.id,
      processedModels,
      totalModels,
      duration
    });
  }, [showSuccess]);

  const handleJobFailed = useCallback((job: JobStatus) => {
    const jobIdShort = job.id.substring(0, 8);
    const message = `❌ Job #${jobIdShort} falhou. Verifique os logs para mais detalhes.`;
    
    showError(message, 10000); // 10 segundos para erros
    
    logger.error('Job failure notification shown', {
      component: 'JobHistoryTable',
      jobId: job.id
    });
  }, [showError]);

  // Identificar jobs ativos para polling
  const activeJobIds = useMemo(() => {
    return jobs
      .filter(job => job.status === 'QUEUED' || job.status === 'PROCESSING')
      .map(job => job.id);
  }, [jobs]);

  // Hook de polling para jobs ativos
  const { 
    jobs: polledJobs, 
    isPolling, 
    lastUpdate,
    refresh: refreshPolling 
  } = useJobPolling(activeJobIds, { 
    enabled: activeJobIds.length > 0,
    onJobCompleted: handleJobCompleted,
    onJobFailed: handleJobFailed
  });

  // Função para alternar expansão de linha
  const toggleRowExpansion = useCallback((jobId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }, []);

  // Aplicar filtros aos jobs
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    // Filtro por ID
    if (searchId.trim()) {
      filtered = filtered.filter(job => 
        job.id.toLowerCase().includes(searchId.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    return filtered;
  }, [jobs, searchId, statusFilter]);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      logger.info('Loading jobs history', {
        component: 'JobHistoryTable',
        page: page + 1,
        limit: rowsPerPage
      });

      const result = await certificationApi.getHistory(page + 1, rowsPerPage);
      setJobs(result.jobs || []);
      setTotal(result.pagination?.total || 0);

      logger.info('Jobs history loaded', {
        component: 'JobHistoryTable',
        count: result.jobs?.length || 0,
        total: result.pagination?.total || 0
      });
    } catch (err) {
      logger.error('Failed to load jobs', {
        component: 'JobHistoryTable',
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Atualizar jobs quando polling retorna novos dados
  useEffect(() => {
    if (polledJobs.length > 0) {
      setJobs(prevJobs => {
        const updatedJobs = [...prevJobs];
        
        polledJobs.forEach(polledJob => {
          const index = updatedJobs.findIndex(j => j.id === polledJob.id);
          if (index !== -1) {
            updatedJobs[index] = polledJob;
          }
        });
        
        return updatedJobs;
      });

      logger.debug('Jobs updated from polling', {
        component: 'JobHistoryTable',
        updatedCount: polledJobs.length
      });
    }
  }, [polledJobs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    logger.info('Manual refresh triggered', { component: 'JobHistoryTable' });
    
    await Promise.all([
      loadJobs(),
      refreshPolling()
    ]);
    
    setRefreshing(false);
  }, [loadJobs, refreshPolling]);

  const formatLastUpdate = useCallback(() => {
    if (!lastUpdate) return null;
    
    const now = Date.now();
    const diff = now - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return `Atualizado há ${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      return `Atualizado há ${minutes}m`;
    }
  }, [lastUpdate]);

  return {
    // Estado
    jobs,
    loading,
    refreshing,
    page,
    rowsPerPage,
    total,
    searchId,
    statusFilter,
    expandedRows,
    filteredJobs,
    activeJobIds,
    isPolling,
    lastUpdate,
    
    // Ações
    setPage,
    setRowsPerPage,
    setSearchId,
    setStatusFilter,
    toggleRowExpansion,
    handleRefresh,
    formatLastUpdate
  };
}
