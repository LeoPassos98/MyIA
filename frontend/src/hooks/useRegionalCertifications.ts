// frontend/src/hooks/useRegionalCertifications.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * useRegionalCertifications Hook
 *
 * Hook React Query para buscar e cachear certificações regionais de modelos.
 * Suporta auto-refresh e cache local para otimização de performance.
 *
 * @module hooks/useRegionalCertifications
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { certificationService } from '../services/certificationService';
import type { RegionalCertification, AWSRegion } from '../types/ai';

/**
 * Resultado do hook useRegionalCertifications
 */
export interface UseRegionalCertificationsResult {
  /** Array de certificações regionais */
  certifications: RegionalCertification[];
  /** Indica se está carregando */
  isLoading: boolean;
  /** Erro ocorrido durante o fetch (null se sem erro) */
  error: Error | null;
  /** Função para forçar refetch das certificações */
  refetch: () => void;
  /** Indica se os dados estão sendo buscados em background */
  isFetching: boolean;
  /** Indica se a query está habilitada */
  isEnabled: boolean;
}

/**
 * Opções para o hook useRegionalCertifications
 */
export interface UseRegionalCertificationsOptions {
  /** Habilitar auto-refresh a cada 30 segundos */
  autoRefresh?: boolean;
  /** Intervalo de refresh em milissegundos (padrão: 30000 = 30s) */
  refreshInterval?: number;
  /** Habilitar a query (padrão: true) */
  enabled?: boolean;
}

/**
 * Hook para buscar certificações regionais de um modelo específico
 * 
 * Utiliza React Query para cache automático com as seguintes configurações:
 * - staleTime: 5 minutos (certificações podem mudar)
 * - cacheTime: 10 minutos (dados permanecem em cache)
 * - retry: 1 tentativa em caso de erro
 * - refetchOnWindowFocus: false (não refetch ao focar janela)
 * - refetchInterval: 30s (se autoRefresh habilitado)
 * 
 * @param modelId - ID completo do modelo (ex: 'anthropic:claude-3-5-sonnet-20241022')
 * @param providerId - ID do provider (ex: 'aws-bedrock')
 * @param options - Opções de configuração do hook
 * @returns Objeto com certificações regionais, loading state, error e refetch function
 * 
 * @example
 * ```typescript
 * // Uso básico
 * const { certifications, isLoading, error } = useRegionalCertifications(
 *   'anthropic:claude-3-5-sonnet-20241022',
 *   'aws-bedrock'
 * );
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * 
 * // Renderizar badges por região
 * {certifications.map(cert => (
 *   <CertificationBadge
 *     key={cert.region}
 *     status={cert.status}
 *     region={cert.region}
 *   />
 * ))}
 * ```
 * 
 * @example
 * ```typescript
 * // Com auto-refresh
 * const { certifications, refetch } = useRegionalCertifications(
 *   modelId,
 *   providerId,
 *   { autoRefresh: true, refreshInterval: 30000 }
 * );
 * ```
 */
export function useRegionalCertifications(
  modelId: string | null,
  providerId: string | null,
  options: UseRegionalCertificationsOptions = {}
): UseRegionalCertificationsResult {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 segundos
    enabled = true
  } = options;

  // Query só é habilitada se modelId e providerId estão presentes
  const isEnabled = Boolean(modelId && providerId) && enabled;

  // Configurar React Query
  const query: UseQueryResult<RegionalCertification[], Error> = useQuery({
    // Query key única baseada no modelId e providerId
    queryKey: ['regionalCertifications', modelId, providerId],
    
    // Query function que busca as certificações regionais
    queryFn: async () => {
      if (!modelId || !providerId) {
        throw new Error('Model ID and Provider ID are required');
      }
      
      const certifications = await certificationService.getAllRegionalCertifications(
        modelId,
        providerId
      );
      
      return certifications;
    },
    
    // Configurações de cache e refetch
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    retry: 1, // Tentar 1 vez em caso de erro
    retryDelay: 1000, // 1 segundo entre tentativas
    refetchOnWindowFocus: false, // Não refetch ao focar janela
    refetchOnMount: false, // Não refetch ao montar (usa cache)
    refetchOnReconnect: false, // Não refetch ao reconectar
    
    // Auto-refresh se habilitado
    refetchInterval: autoRefresh ? refreshInterval : false,
    
    // Só executa se enabled
    enabled: isEnabled,
  });

  // Extrair dados da query
  const { data, isLoading, error, refetch, isFetching } = query;

  // Retornar interface simplificada
  return {
    certifications: data ?? [],
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
 * Hook auxiliar para buscar certificação de uma região específica
 * 
 * @param modelId - ID do modelo
 * @param providerId - ID do provider
 * @param region - Região AWS específica
 * @returns Certificação regional ou null se não encontrada
 * 
 * @example
 * ```typescript
 * const certification = useRegionalCertification(
 *   'anthropic:claude-3-5-sonnet-20241022',
 *   'aws-bedrock',
 *   'us-east-1'
 * );
 * 
 * <CertificationBadge
 *   status={certification?.status || 'not_tested'}
 *   region={region}
 * />
 * ```
 */
export function useRegionalCertification(
  modelId: string | null,
  providerId: string | null,
  region: AWSRegion
): RegionalCertification | null {
  const { certifications } = useRegionalCertifications(modelId, providerId);
  
  return certifications.find(cert => cert.region === region) || null;
}

/**
 * Hook auxiliar para verificar se um modelo está certificado em todas as regiões
 * 
 * @param modelId - ID do modelo
 * @param providerId - ID do provider
 * @returns true se certificado em todas as regiões, false caso contrário
 * 
 * @example
 * ```typescript
 * const isFullyCertified = useIsFullyCertified(
 *   'anthropic:claude-3-5-sonnet-20241022',
 *   'aws-bedrock'
 * );
 * 
 * <Chip
 *   label={isFullyCertified ? 'Certificado Globalmente' : 'Certificação Parcial'}
 *   color={isFullyCertified ? 'success' : 'warning'}
 * />
 * ```
 */
export function useIsFullyCertified(
  modelId: string | null,
  providerId: string | null
): boolean {
  const { certifications, isLoading } = useRegionalCertifications(modelId, providerId);
  
  if (isLoading || certifications.length === 0) {
    return false;
  }
  
  // Verificar se todas as regiões estão certificadas
  return certifications.every(cert => cert.status === 'certified');
}

/**
 * Hook auxiliar para obter estatísticas de certificação regional
 * 
 * @param modelId - ID do modelo
 * @param providerId - ID do provider
 * @returns Estatísticas de certificação
 * 
 * @example
 * ```typescript
 * const stats = useRegionalCertificationStats(modelId, providerId);
 * 
 * <Typography>
 *   Certificado em {stats.certifiedCount} de {stats.totalRegions} regiões
 * </Typography>
 * ```
 */
export function useRegionalCertificationStats(
  modelId: string | null,
  providerId: string | null
): {
  totalRegions: number;
  certifiedCount: number;
  failedCount: number;
  warningCount: number;
  notTestedCount: number;
  certificationRate: number;
} {
  const { certifications, isLoading } = useRegionalCertifications(modelId, providerId);
  
  if (isLoading || certifications.length === 0) {
    return {
      totalRegions: 0,
      certifiedCount: 0,
      failedCount: 0,
      warningCount: 0,
      notTestedCount: 0,
      certificationRate: 0
    };
  }
  
  const certifiedCount = certifications.filter(c => c.status === 'certified').length;
  const failedCount = certifications.filter(c => 
    c.status === 'failed' || 
    c.status === 'configuration_required' || 
    c.status === 'permission_required'
  ).length;
  const warningCount = certifications.filter(c => c.status === 'quality_warning').length;
  const notTestedCount = certifications.filter(c => c.status === 'not_tested').length;
  
  return {
    totalRegions: certifications.length,
    certifiedCount,
    failedCount,
    warningCount,
    notTestedCount,
    certificationRate: certifications.length > 0 
      ? Math.round((certifiedCount / certifications.length) * 100) 
      : 0
  };
}
