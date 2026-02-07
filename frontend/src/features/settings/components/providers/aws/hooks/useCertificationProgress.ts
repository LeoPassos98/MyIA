// frontend/src/features/settings/components/providers/aws/hooks/useCertificationProgress.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useCallback } from 'react';
import { EnrichedAWSModel, CertificationDetails } from '@/types/ai';
import { certificationService } from '@/services/certificationService';
import { logger } from '@/utils/logger';

/**
 * Status de progresso de certificação de um modelo
 */
export type CertificationProgressStatus = 'pending' | 'running' | 'success' | 'error';

/**
 * Progresso de certificação de um modelo individual
 */
export interface ModelCertificationProgress {
  modelId: string;
  modelName: string;
  status: CertificationProgressStatus;
  startTime?: number;
  endTime?: number;
  error?: string;
  result?: CertificationDetails;
}

/**
 * Props para o hook de progresso de certificação
 */
export interface UseCertificationProgressProps {
  availableModels: EnrichedAWSModel[];
  refreshCertifications: () => Promise<void>;
}

/**
 * Retorno do hook de progresso de certificação
 */
export interface UseCertificationProgressReturn {
  progress: ModelCertificationProgress[];
  isDialogOpen: boolean;
  canCancel: boolean;
  startCertification: (modelIds: string[]) => Promise<void>;
  cancelCertification: () => void;
  closeDialog: () => void;
}

/**
 * Hook para gerenciar progresso de certificação de modelos
 * 
 * Responsabilidades:
 * - Gerenciar estado de progresso de certificação
 * - Executar certificação em lote com progresso individual
 * - Fazer polling de resultados
 * - Invalidar cache após certificação
 * - Permitir cancelamento
 * 
 * @param props - Props com modelos disponíveis e função de refresh
 * @returns Estado e handlers de certificação
 */
export function useCertificationProgress(
  props: UseCertificationProgressProps
): UseCertificationProgressReturn {
  const { availableModels, refreshCertifications } = props;
  
  const [progress, setProgress] = useState<ModelCertificationProgress[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [canCancel, setCanCancel] = useState(false);
  const [certificationAborted, setCertificationAborted] = useState(false);
  
  /**
   * Inicia certificação de múltiplos modelos
   */
  const startCertification = useCallback(async (modelIds: string[]) => {
    // Inicializar progresso para cada modelo
    const initialProgress: ModelCertificationProgress[] = modelIds.map(modelId => {
      const model = availableModels.find(m => m.apiModelId === modelId);
      return {
        modelId,
        modelName: model?.name || modelId,
        status: 'pending' as const
      };
    });
    
    setProgress(initialProgress);
    setIsDialogOpen(true);
    setCanCancel(true);
    setCertificationAborted(false);

    try {
      // Certificar modelos um por vez para mostrar progresso
      for (let i = 0; i < modelIds.length; i++) {
        // Verificar se foi cancelado
        if (certificationAborted) {
          // Marcar modelos restantes como cancelados
          setProgress(prev =>
            prev.map((p, idx) =>
              idx >= i ? { ...p, status: 'error' as const, error: 'Cancelado pelo usuário' } : p
            )
          );
          break;
        }
        
        const modelId = modelIds[i];
        const startTime = Date.now();
        
        // Atualizar status para "running"
        setProgress(prev =>
          prev.map(p => p.modelId === modelId ? { ...p, status: 'running' as const, startTime } : p)
        );
        
        try {
          await certificationService.certifyModel(modelId);
          
          // ✅ CORREÇÃO: Aguardar o worker processar antes de buscar detalhes
          // Fazer polling até o worker concluir (máximo 30 segundos)
          logger.debug('[useCertificationProgress] ⏳ Aguardando worker processar certificação...', { modelId });
          
          let regionalCert = null;
          let attempts = 0;
          const maxAttempts = 15; // 15 tentativas x 2s = 30s máximo
          
          while (attempts < maxAttempts && !regionalCert) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
            regionalCert = await certificationService.getCertificationDetails(modelId);
            attempts++;
            
            logger.debug('[useCertificationProgress] 🔍 Tentativa de buscar certificação', {
              modelId,
              attempt: attempts,
              found: !!regionalCert,
              status: regionalCert?.status
            });
            
            // Se encontrou certificação com status final, parar
            if (regionalCert && (regionalCert.status === 'certified' || regionalCert.status === 'failed' || regionalCert.status === 'quality_warning')) {
              break;
            }
          }
          
          const endTime = Date.now();
          
          if (!regionalCert) {
            logger.warn('[useCertificationProgress] ⚠️ Timeout aguardando certificação', { modelId, attempts });
          }
          
          // ✅ Converter RegionalCertification para CertificationDetails
          const certDetails: CertificationDetails | undefined = regionalCert ? {
            modelId: regionalCert.modelId,
            status: regionalCert.status,
            isAvailable: regionalCert.status === 'certified' || regionalCert.status === 'quality_warning',
            lastChecked: regionalCert.lastTestedAt || regionalCert.updatedAt,
            error: regionalCert.lastError
          } : undefined;
          
          // Sucesso
          setProgress(prev =>
            prev.map(p => p.modelId === modelId ? {
              ...p,
              status: 'success' as const,
              endTime,
              result: certDetails
            } : p)
          );
        } catch (error: any) {
          const endTime = Date.now();
          const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
          
          // Erro
          setProgress(prev =>
            prev.map(p => p.modelId === modelId ? {
              ...p,
              status: 'error' as const,
              error: errorMessage,
              endTime
            } : p)
          );
        }
      }

      // ✅ FIX: Após certificar, invalidar cache e recarregar dados do backend
      // Isso garante que os badges sejam atualizados imediatamente
      // ✅ AGUARDAR 2 segundos antes de buscar para dar tempo do backend salvar
      logger.debug('[useCertificationProgress] ⏳ Aguardando 2s antes de invalidar cache...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ✅ Invalidar cache e recarregar dados
      logger.debug('[useCertificationProgress] 🔄 Invalidando cache de certificações...');
      await refreshCertifications();
      
      logger.debug('[useCertificationProgress] ✅ Cache invalidado e dados recarregados');
    } catch (error) {
      logger.error('[useCertificationProgress] Erro ao certificar modelos', { error });
    } finally {
      setCanCancel(false);
    }
  }, [availableModels, refreshCertifications, certificationAborted]);
  
  /**
   * Cancela certificação em andamento
   */
  const cancelCertification = useCallback(() => {
    setCertificationAborted(true);
    setCanCancel(false);
  }, []);
  
  /**
   * Fecha diálogo de progresso
   */
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setProgress([]);
    setCertificationAborted(false);
  }, []);
  
  return {
    progress,
    isDialogOpen,
    canCancel,
    startCertification,
    cancelCertification,
    closeDialog
  };
}
