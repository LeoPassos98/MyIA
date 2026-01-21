// frontend/src/hooks/useCertificationDetails.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * useCertificationDetails Hook
 *
 * Hook React Query para buscar e cachear detalhes de certificação de modelos.
 * Gerencia loading states, error handling e cache automático.
 *
 * @module hooks/useCertificationDetails
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { certificationService } from '../services/certificationService';
import type { CertificationDetails } from '../types/ai';

/**
 * Interface estendida para detalhes de certificação com campos adicionais
 */
export interface ExtendedCertificationDetails extends CertificationDetails {
  testsPassed?: number;
  testsFailed?: number;
  successRate?: number;
  suggestedActions?: string[];
}

/**
 * Resultado do hook useCertificationDetails
 */
export interface UseCertificationDetailsResult {
  /** Detalhes da certificação (null se não carregado ou não certificado) */
  certificationDetails: ExtendedCertificationDetails | null;
  /** Indica se está carregando */
  isLoading: boolean;
  /** Erro ocorrido durante o fetch (null se sem erro) */
  error: Error | null;
  /** Função para forçar refetch dos detalhes */
  refetch: () => void;
  /** Indica se os dados estão sendo buscados em background */
  isFetching: boolean;
  /** Indica se a query está habilitada */
  isEnabled: boolean;
}

/**
 * Hook para buscar detalhes de certificação de um modelo específico
 * 
 * Utiliza React Query para cache automático com as seguintes configurações:
 * - staleTime: 5 minutos (certificações podem mudar)
 * - cacheTime: 10 minutos (dados permanecem em cache)
 * - retry: 1 tentativa em caso de erro
 * - refetchOnWindowFocus: false (não refetch ao focar janela)
 * 
 * @param modelId - ID completo do modelo (ex: 'anthropic:claude-3-5-sonnet-20241022')
 * @returns Objeto com detalhes de certificação, loading state, error e refetch function
 * 
 * @example
 * ```typescript
 * // Uso básico
 * const { certificationDetails, isLoading, error } = useCertificationDetails(
 *   'anthropic:claude-3-5-sonnet-20241022'
 * );
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * 
 * // Usar detalhes para renderizar badge
 * <CertificationBadge
 *   status={certificationDetails?.status}
 *   errorCategory={certificationDetails?.errorCategory}
 * />
 * ```
 * 
 * @example
 * ```typescript
 * // Com refetch manual
 * const { certificationDetails, refetch } = useCertificationDetails(modelId);
 * 
 * const handleRecertify = async () => {
 *   await certificationService.certifyModel(modelId);
 *   refetch(); // Atualizar detalhes
 * };
 * ```
 */
export function useCertificationDetails(
  modelId: string | null
): UseCertificationDetailsResult {
  // Query só é habilitada se modelId está presente
  const isEnabled = Boolean(modelId);

  // Configurar React Query
  const query: UseQueryResult<ExtendedCertificationDetails | null, Error> = useQuery({
    // Query key única baseada no modelId
    queryKey: ['certificationDetails', modelId],
    
    // Query function que busca os detalhes
    queryFn: async () => {
      if (!modelId) {
        throw new Error('Model ID is required');
      }
      
      const details = await certificationService.getCertificationDetails(modelId);
      
      // Se não há detalhes, retornar null
      if (!details) {
        return null;
      }
      
      // Calcular campos adicionais se disponíveis
      const extended: ExtendedCertificationDetails = {
        ...details,
        // Adicionar campos calculados se necessário
        suggestedActions: details.categorizedError?.suggestedActions || [],
      };
      
      return extended;
    },
    
    // Configurações de cache e refetch
    staleTime: 1000 * 60 * 5, // 5 minutos (certificações podem mudar)
    gcTime: 1000 * 60 * 10, // 10 minutos
    retry: 1, // Tentar 1 vez em caso de erro
    retryDelay: 1000, // 1 segundo entre tentativas
    refetchOnWindowFocus: false, // Não refetch ao focar janela
    refetchOnMount: false, // Não refetch ao montar (usa cache)
    refetchOnReconnect: false, // Não refetch ao reconectar
    
    // Só executa se enabled
    enabled: isEnabled,
  });

  // Extrair dados da query
  const { data, isLoading, error, refetch, isFetching } = query;

  // Retornar interface simplificada
  return {
    certificationDetails: data ?? null,
    isLoading,
    error: error ?? null,
    refetch: () => {
      refetch();
    },
    isFetching,
    isEnabled,
  };
}

/**
 * Hook auxiliar para verificar se um modelo está certificado
 * 
 * @param modelId - ID do modelo
 * @returns true se o modelo está certificado, false caso contrário
 * 
 * @example
 * ```typescript
 * const isCertified = useIsModelCertified('anthropic:claude-3-5-sonnet-20241022');
 * 
 * <Chip
 *   label={isCertified ? 'Certificado' : 'Não Certificado'}
 *   color={isCertified ? 'success' : 'default'}
 * />
 * ```
 */
export function useIsModelCertified(modelId: string | null): boolean {
  const { certificationDetails } = useCertificationDetails(modelId);
  return certificationDetails?.status === 'certified';
}

/**
 * Hook auxiliar para obter o status de certificação de forma simplificada
 *
 * @param modelId - ID do modelo
 * @returns Status de certificação ou 'not_tested' se não disponível
 *
 * @example
 * ```typescript
 * const status = useCertificationStatus('anthropic:claude-3-5-sonnet-20241022');
 *
 * const color = status === 'certified' ? 'success' :
 *               status === 'quality_warning' ? 'warning' : 'error';
 * ```
 */
export function useCertificationStatus(
  modelId: string | null
): 'certified' | 'quality_warning' | 'failed' | 'not_tested' {
  const { certificationDetails, isLoading } = useCertificationDetails(modelId);
  
  if (isLoading || !certificationDetails || !certificationDetails.status) {
    return 'not_tested';
  }
  
  // Mapear todos os status possíveis para os 4 estados simplificados
  const status = certificationDetails.status;
  if (status === 'certified') return 'certified';
  if (status === 'quality_warning') return 'quality_warning';
  if (status === 'failed' || status === 'configuration_required' || status === 'permission_required') {
    return 'failed';
  }
  
  return 'not_tested';
}
