/**
 * frontend/src/features/settings/components/ModelsManagement/hooks/useCertificationBatch.ts
 * Hook for managing batch certification and model selection
 * Standards: docs/STANDARDS.md §3.0, §15
 */

import { useState, useCallback } from 'react';
import { certificationService } from '@/services/certificationService';
import { useAWSConfig } from '../../../hooks/useAWSConfig';
import { logger } from '@/utils/logger';

interface UseCertificationBatchParams {
  certifiedModels: string[];
  setCertifiedModels: React.Dispatch<React.SetStateAction<string[]>>;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

/**
 * Hook para gerenciar certificação em lote e seleção de modelos
 */
export function useCertificationBatch({
  certifiedModels,
  setCertifiedModels,
  setError,
  setSuccess,
}: UseCertificationBatchParams) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isCertifying, setIsCertifying] = useState<string | null>(null);
  const [isCertifyingBatch, setIsCertifyingBatch] = useState(false);

  const {
    selectedModels: awsEnabledModels,
    setSelectedModels: setAWSEnabledModels,
    handleSave: saveAWSConfig,
  } = useAWSConfig();

  /**
   * Toggle seleção de um modelo individual
   */
  const handleToggleModel = useCallback((modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  }, []);

  /**
   * Calcula modelos não certificados na seleção atual
   */
  const getUncertifiedSelected = useCallback(() => {
    return selectedModels.filter((id) => !certifiedModels.includes(id));
  }, [selectedModels, certifiedModels]);

  /**
   * Certifica múltiplos modelos em lote
   */
  const handleCertifySelected = useCallback(async () => {
    const uncertified = getUncertifiedSelected();

    if (uncertified.length === 0) {
      setError('Todos os modelos selecionados já estão certificados');
      return;
    }

    logger.debug(
      `[useCertificationBatch] Certificando ${uncertified.length} modelos...`
    );
    setIsCertifyingBatch(true);
    setError(null);
    setSuccess(null);

    let successCount = 0;
    let failCount = 0;
    const newCertifiedModels: string[] = [];

    // ✅ OTIMIZAÇÃO: Loop sem atualizações de estado intermediárias
    for (const modelId of uncertified) {
      try {
        const result = await certificationService.certifyModel(modelId);

        // Verificar se o job foi criado com sucesso
        // O status pode ser 'queued', 'processing', etc.
        if (result.jobId && result.status) {
          successCount++;
          newCertifiedModels.push(modelId);
        } else {
          failCount++;
        }
      } catch (err) {
        logger.error(
          `[useCertificationBatch] Erro ao certificar ${modelId}:`,
          err
        );
        failCount++;
      }
    }

    // ✅ OTIMIZAÇÃO: Atualizar estado UMA VEZ após loop
    if (newCertifiedModels.length > 0) {
      setCertifiedModels((prev) => [
        ...new Set([...prev, ...newCertifiedModels]),
      ]);

      // ✅ OTIMIZAÇÃO: Save UMA VEZ com todos os modelos
      const modelsToAdd = newCertifiedModels.filter(
        (id) => !awsEnabledModels.includes(id)
      );
      if (modelsToAdd.length > 0) {
        const updatedModels = [...awsEnabledModels, ...modelsToAdd];
        setAWSEnabledModels(updatedModels);
        await saveAWSConfig();
        logger.debug(
          `[useCertificationBatch] ✅ ${modelsToAdd.length} modelos salvos automaticamente`
        );
      }
    }

    setIsCertifyingBatch(false);
    setSelectedModels([]); // Limpar seleção

    if (successCount > 0) {
      setSuccess(`${successCount} modelo(s) certificado(s) com sucesso!`);
    }
    if (failCount > 0) {
      setError(`${failCount} modelo(s) falharam na certificação`);
    }
  }, [
    getUncertifiedSelected,
    setCertifiedModels,
    awsEnabledModels,
    setAWSEnabledModels,
    saveAWSConfig,
    setError,
    setSuccess,
  ]);

  return {
    selectedModels,
    setSelectedModels,
    isCertifying,
    setIsCertifying,
    isCertifyingBatch,
    handleToggleModel,
    handleCertifySelected,
    uncertifiedSelectedCount: getUncertifiedSelected().length,
  };
}
