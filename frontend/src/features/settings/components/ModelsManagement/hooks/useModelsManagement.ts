/**
 * frontend/src/features/settings/components/ModelsManagement/hooks/useModelsManagement.ts
 * Main hook for models management logic
 * Standards: docs/STANDARDS.md §3.0, §15
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AIProvider } from '@/types/ai';
import { certificationService } from '@/services/certificationService';
import { aiProvidersService } from '@/services/aiProvidersService';
import { useAWSConfig } from '../../../hooks/useAWSConfig';
import { useModelFilters } from './useModelFilters';
import { useCertificationBatch } from './useCertificationBatch';
import { logger } from '@/utils/logger';
import type { ModelWithProvider } from '../types';

/**
 * Hook principal para gerenciamento de modelos
 * Centraliza toda a lógica de estado e operações
 */
export function useModelsManagement() {
  // Estados principais
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [certifiedModels, setCertifiedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Hooks customizados
  const filters = useModelFilters();
  const batch = useCertificationBatch({
    certifiedModels,
    setCertifiedModels,
    setError,
    setSuccess,
  });
  const {
    selectedModels: awsEnabledModels,
    setSelectedModels: setAWSEnabledModels,
    handleSave: saveAWSConfig,
  } = useAWSConfig();

  /**
   * Carrega dados de providers e certificações
   */
  const loadData = useCallback(async () => {
    try {
      logger.debug('[useModelsManagement] 🔄 Iniciando loadData...');
      setIsLoading(true);
      setError(null);

      const [providersData, certifiedData] = await Promise.all([
        aiProvidersService.getConfigured(),
        certificationService.getCertifiedModels(),
      ]);

      logger.debug('[useModelsManagement] 📦 Providers recebidos:', providersData);
      logger.debug(
        '[useModelsManagement] ✅ Modelos certificados recebidos:',
        certifiedData
      );

      setProviders(providersData);
      setCertifiedModels(certifiedData);

      logger.debug(
        '[useModelsManagement] 💾 Estado atualizado - certifiedModels:',
        certifiedData
      );
    } catch (err) {
      logger.error('[useModelsManagement] ❌ Erro ao carregar dados:', err);
      setError('Erro ao carregar modelos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Extrai todos os modelos de todos os providers
   */
  const allModels = useMemo<ModelWithProvider[]>(() => {
    return providers.flatMap((provider) =>
      provider.models.map((model) => ({
        ...model,
        providerSlug: provider.slug,
        providerName: provider.name,
      }))
    );
  }, [providers]);

  /**
   * Aplica filtros aos modelos
   */
  const filteredModels = useMemo(() => {
    return filters.applyFilter(allModels, certifiedModels);
  }, [allModels, certifiedModels, filters]);

  /**
   * Calcula contadores de filtros
   */
  const filterCounts = useMemo(() => {
    return filters.getFilterCounts(allModels, certifiedModels);
  }, [allModels, certifiedModels, filters]);

  /**
   * Certifica um modelo individual
   */
  const handleCertifyModel = useCallback(
    async (modelId: string) => {
      logger.debug(`[useModelsManagement] Iniciando certificação para: ${modelId}`);
      batch.setIsCertifying(modelId);
      setError(null);
      setSuccess(null);

      try {
        logger.debug(`[useModelsManagement] Chamando certificationService.certifyModel...`);
        const result = await certificationService.certifyModel(modelId);
        logger.debug(`[useModelsManagement] Resultado da certificação:`, result);

        // Verificar se o job foi criado com sucesso
        if (result.jobId && result.status) {
          // ✅ OTIMIZAÇÃO: Atualizar apenas certifiedModels (sem recarregar providers)
          setCertifiedModels((prev) => [...new Set([...prev, modelId])]);
          setSuccess(`Modelo ${modelId} certificado com sucesso!`);

          // ✅ AUTO-SAVE: Adicionar modelo aos habilitados automaticamente
          if (!awsEnabledModels.includes(modelId)) {
            setAWSEnabledModels([...awsEnabledModels, modelId]);
            await saveAWSConfig();
            logger.debug(
              `[useModelsManagement] ✅ Modelo ${modelId} salvo automaticamente`
            );
          }
        } else {
          setError(`Falha na certificação: ${result.status}`);
        }
      } catch (err: any) {
        logger.error('[useModelsManagement] Erro ao certificar modelo:', err);
        const errorMsg =
          err.response?.data?.message || err.message || 'Erro ao certificar modelo';
        setError(errorMsg);
      } finally {
        batch.setIsCertifying(null);
      }
    },
    [awsEnabledModels, batch, saveAWSConfig, setAWSEnabledModels]
  );

  /**
   * Seleciona todos os modelos visíveis
   */
  const handleSelectAll = useCallback(() => {
    const allVisibleIds = filteredModels.map((m) => m.apiModelId);
    batch.setSelectedModels(allVisibleIds);
  }, [filteredModels, batch]);

  /**
   * Desseleciona todos os modelos
   */
  const handleDeselectAll = useCallback(() => {
    batch.setSelectedModels([]);
  }, [batch]);

  return {
    // Estado
    isLoading,
    error,
    success,
    providers,
    certifiedModels,
    allModels,
    filteredModels,
    filterCounts,

    // Filtros
    filter: filters.filter,
    setFilter: filters.setFilter,

    // Seleção
    selectedModels: batch.selectedModels,
    handleToggleModel: batch.handleToggleModel,
    handleSelectAll,
    handleDeselectAll,

    // Certificação
    isCertifying: batch.isCertifying,
    isCertifyingBatch: batch.isCertifyingBatch,
    uncertifiedSelectedCount: batch.uncertifiedSelectedCount,
    handleCertifyModel,
    handleCertifySelected: batch.handleCertifySelected,

    // Ações
    loadData,
    setError,
    setSuccess,
  };
}
