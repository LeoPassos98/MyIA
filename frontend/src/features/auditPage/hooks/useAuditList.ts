// frontend/src/features/auditPage/hooks/useAuditList.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect } from 'react';
import { auditService, AuditRecord } from '../../../services/auditService';
import { AuditPageFilters, AuditTableRow } from '../types';
import { mapAuditRecord } from '../mappers/mapAuditRecord';

export function useAuditList() {
  const [records, setRecords] = useState<AuditTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<AuditPageFilters>({
    provider: '',
    model: '',
    dateFrom: '',
    dateTo: '',
  });

  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  

  useEffect(() => {
    let isMounted = true;

    async function fetchAudits() {
      try {
        setLoading(true);
        setError(null);

        const auditFilters = {
          provider: filters.provider || undefined,
          model: filters.model || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          limit: 100,
        };

        const data = await auditService.listAudits(auditFilters);

        if (isMounted) {
          setRecords(data.map(mapAuditRecord));
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar auditorias');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAudits();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<AuditPageFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRowClick = async (messageId: string) => {
    try {
      setLoadingAudit(true);
      const audit = await auditService.getAuditByMessageId(messageId);
      setSelectedAudit(audit);
    } catch (err) {
      console.error('Erro ao buscar auditoria:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedAudit(null);
  };

  return {
    records,
    loading,
    error,
    filters,
    handleFilterChange,
    selectedAudit,
    loadingAudit,
    handleRowClick,
    handleCloseModal,
  };
}
