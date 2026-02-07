// frontend-admin/src/components/Certifications/hooks/useCertificationForm.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect } from 'react';
import { certificationApi } from '../../../services/certificationApi';
import { useNotification } from '../../../hooks/useNotification';
import { logger } from '../../../utils/logger';

export function useCertificationForm() {
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [certifyType, setCertifyType] = useState<'all' | 'single'>('all');
  const [loading, setLoading] = useState(false);

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const regions = await certificationApi.getRegions();
      setRegions(regions || []);
    } catch (err) {
      logger.error('Failed to load regions', {
        component: 'useCertificationForm',
        error: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleSubmit = async () => {
    if (selectedRegions.length === 0) {
      showError('Selecione pelo menos uma região');
      return;
    }

    setLoading(true);

    try {
      logger.info('Iniciando certificação para regiões', {
        component: 'useCertificationForm',
        regions: selectedRegions
      });
      
      const result = await certificationApi.certifyAll(selectedRegions);
      
      logger.info('Resultado da certificação', {
        component: 'useCertificationForm',
        result
      });
      
      const jobCount = result.totalJobs || 1;
      const message = `🚀 ${jobCount} job${jobCount > 1 ? 's' : ''} criado${jobCount > 1 ? 's' : ''} com sucesso! Acompanhe o progresso na tabela abaixo.`;
      
      showSuccess(message);
      setSelectedRegions([]);
    } catch (err: any) {
      logger.error('Erro ao criar job', {
        component: 'useCertificationForm',
        error: err.message
      });
      
      const errorMessage = err.response?.data?.message 
        || err.message 
        || 'Erro ao criar job de certificação';
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    regions,
    selectedRegions,
    setSelectedRegions,
    certifyType,
    setCertifyType,
    loading,
    handleSubmit
  };
}
