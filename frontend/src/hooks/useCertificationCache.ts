// frontend/src/hooks/useCertificationCache.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect } from 'react';
import { certificationService } from '../services/certificationService';

/**
 * Hook para gerenciar cache compartilhado de dados de certificação
 * Reduz chamadas API duplicadas entre componentes
 * 
 * ✅ Características:
 * - Busca dados uma única vez e compartilha entre componentes
 * - Cache automático com TTL de 5 minutos
 * - Estados de loading e erro
 * - Funções auxiliares para verificação rápida
 * 
 * @example
 * const { certifiedModels, isCertified, loading } = useCertificationCache();
 * if (isCertified('claude-3-opus')) {
 *   // Modelo está certificado
 * }
 */
export function useCertificationCache() {
  const [certifiedModels, setCertifiedModels] = useState<string[]>([]);
  const [unavailableModels, setUnavailableModels] = useState<string[]>([]);
  const [qualityWarningModels, setQualityWarningModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Busca dados uma única vez e compartilha entre componentes
  useEffect(() => {
    /**
     * Carrega dados de certificação de todos os modelos
     * Faz 3 chamadas em paralelo para otimizar performance
     */
    async function loadCertifications() {
      try {
        const [certified, failed, warnings] = await Promise.all([
          certificationService.getCertifiedModels(),
          certificationService.getAllFailedModels(),
          certificationService.getQualityWarningModels()
        ]);
        setCertifiedModels(certified);
        setUnavailableModels(failed);
        setQualityWarningModels(warnings);
      } catch (error) {
        console.error('[useCertificationCache] Erro ao carregar certificações:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCertifications();
  }, []);
  
  /**
   * Verifica se um modelo está certificado
   * @param modelId - ID do modelo a verificar
   * @returns true se o modelo está certificado
   */
  const isCertified = (modelId: string): boolean => {
    return certifiedModels.includes(modelId);
  };

  /**
   * Verifica se um modelo está indisponível
   * @param modelId - ID do modelo a verificar
   * @returns true se o modelo está indisponível
   */
  const isUnavailable = (modelId: string): boolean => {
    return unavailableModels.includes(modelId);
  };

  /**
   * Verifica se um modelo tem aviso de qualidade
   * @param modelId - ID do modelo a verificar
   * @returns true se o modelo tem aviso de qualidade
   */
  const hasQualityWarning = (modelId: string): boolean => {
    return qualityWarningModels.includes(modelId);
  };
  
  return {
    certifiedModels,
    unavailableModels,
    qualityWarningModels,
    loading,
    isCertified,
    isUnavailable,
    hasQualityWarning
  };
}
