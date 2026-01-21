// frontend/src/hooks/useModelCapabilities.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * useModelCapabilities Hook
 *
 * Hook React Query para buscar e cachear capabilities de modelos de IA.
 * Gerencia loading states, error handling e cache automático.
 *
 * @module hooks/useModelCapabilities
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchModelCapabilities } from '../services/api/modelsApi';
import type { ModelCapabilities, CapabilitiesError } from '../types/capabilities';

/**
 * Resultado do hook useModelCapabilities
 */
export interface UseModelCapabilitiesResult {
  /** Capabilities do modelo (null se não carregado ou parâmetros inválidos) */
  capabilities: ModelCapabilities | null;
  /** Indica se está carregando */
  isLoading: boolean;
  /** Erro ocorrido durante o fetch (null se sem erro) */
  error: CapabilitiesError | null;
  /** Função para forçar refetch das capabilities */
  refetch: () => void;
  /** Indica se os dados estão sendo buscados em background */
  isFetching: boolean;
  /** Indica se a query está habilitada */
  isEnabled: boolean;
}

/**
 * Extrai o vendor real do modelId
 *
 * Modelos Bedrock têm formato: "vendor.model-name"
 * Ex: "anthropic.claude-sonnet-4-5-20250929-v1:0" → "anthropic"
 *
 * @param modelId - ID do modelo completo
 * @returns Vendor extraído ou null se inválido
 */
function extractVendor(modelId: string | null): string | null {
  if (!modelId) return null;
  
  // Verificar se contém ponto (formato vendor.model)
  if (modelId.includes('.')) {
    const vendor = modelId.split('.')[0];
    console.log('[extractVendor] Extracted:', { modelId, vendor });
    return vendor;
  }
  
  // Se não tem ponto, retornar o próprio modelId como vendor
  console.log('[extractVendor] No dot found, using modelId as vendor:', modelId);
  return modelId;
}

/**
 * Hook para buscar capabilities de um modelo específico
 *
 * Utiliza React Query para cache automático com as seguintes configurações:
 * - staleTime: Infinity (capabilities não mudam, cache permanente)
 * - cacheTime: 24h (dados permanecem em cache por 24 horas)
 * - retry: 2 tentativas em caso de erro
 * - refetchOnWindowFocus: false (não refetch ao focar janela)
 *
 * @param provider - Provider do modelo (ex: 'bedrock', 'openai') - IGNORADO, vendor é extraído do modelId
 * @param modelId - ID do modelo (ex: 'anthropic.claude-3-5-sonnet-20241022')
 * @returns Objeto com capabilities, loading state, error e refetch function
 *
 * @example
 * ```typescript
 * // Uso básico
 * const { capabilities, isLoading, error } = useModelCapabilities(
 *   'bedrock', // Provider genérico (ignorado)
 *   'anthropic.claude-3-5-sonnet-20241022' // Vendor extraído: 'anthropic'
 * );
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * // Usar capabilities para configurar UI
 * <Slider
 *   disabled={!capabilities?.topK.enabled}
 *   min={capabilities?.topK.min}
 *   max={capabilities?.topK.max}
 * />
 * ```
 *
 * @example
 * ```typescript
 * // Com refetch manual
 * const { capabilities, refetch } = useModelCapabilities(provider, modelId);
 *
 * const handleModelChange = () => {
 *   refetch(); // Forçar atualização
 * };
 * ```
 */
export function useModelCapabilities(
  provider: string | null,
  modelId: string | null
): UseModelCapabilitiesResult {
  // ✅ CORREÇÃO: Extrair vendor do modelId ao invés de usar provider genérico
  // Provider pode ser 'bedrock', mas o vendor real está no modelId: 'anthropic.claude...'
  const vendor = extractVendor(modelId);
  
  // ✅ FIX: Usar modelId diretamente, sem prefixo vendor:
  // O modelId já vem no formato correto: "amazon.nova-micro-v1:0"
  // Backend espera apenas o modelId puro, sem prefixo "vendor:"
  const fullModelId = modelId;

  // 🔍 DEBUG: Log dos parâmetros recebidos e processados
  console.log('[useModelCapabilities] Params:', {
    provider, // Provider genérico (ex: 'bedrock')
    modelId, // ModelId completo (ex: 'amazon.nova-micro-v1:0')
    extractedVendor: vendor, // Vendor extraído (ex: 'amazon')
    fullModelId // Resultado final (ex: 'amazon.nova-micro-v1:0' - SEM prefixo vendor:)
  });

  // Query só é habilitada se ambos os parâmetros estão presentes
  const isEnabled = Boolean(fullModelId);

  // Configurar React Query
  const query: UseQueryResult<ModelCapabilities, CapabilitiesError> = useQuery({
    // Query key única baseada no fullModelId
    queryKey: ['modelCapabilities', fullModelId],
    
    // Query function que busca as capabilities
    queryFn: () => {
      if (!fullModelId) {
        throw new Error('Model ID is required');
      }
      console.log('[useModelCapabilities] Fetching for:', fullModelId);
      return fetchModelCapabilities(fullModelId);
    },
    
    // Configurações de cache e refetch
    staleTime: Infinity, // Capabilities não mudam, cache permanente
    gcTime: 1000 * 60 * 60 * 24, // 24 horas (gcTime é o novo nome do cacheTime no v5)
    retry: 2, // Tentar 2 vezes em caso de erro
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Não refetch ao focar janela
    refetchOnMount: false, // Não refetch ao montar (usa cache)
    refetchOnReconnect: false, // Não refetch ao reconectar
    
    // Só executa se enabled
    enabled: isEnabled,
  });

  // Extrair dados da query
  const { data, isLoading, error, refetch, isFetching } = query;

  // 🔍 DEBUG: Log do resultado
  console.log('[useModelCapabilities] Result:', {
    hasCapabilities: !!data,
    isLoading,
    hasError: !!error,
    errorDetails: error
  });

  if (error) {
    console.error('[useModelCapabilities] Error details:', error);
  }

  // Retornar interface simplificada
  return {
    capabilities: data ?? null,
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
 * Hook auxiliar para verificar se um modelo suporta uma capability específica
 * 
 * @param provider - Provider do modelo
 * @param modelId - ID do modelo
 * @param capability - Nome da capability a verificar
 * @returns true se a capability está habilitada, false caso contrário
 * 
 * @example
 * ```typescript
 * const supportsTopK = useModelSupportsCapability(provider, modelId, 'topK');
 * 
 * <Slider disabled={!supportsTopK} />
 * ```
 */
export function useModelSupportsCapability(
  provider: string | null,
  modelId: string | null,
  capability: keyof ModelCapabilities
): boolean {
  const { capabilities } = useModelCapabilities(provider, modelId);

  if (!capabilities) return false;

  const cap = capabilities[capability];
  
  // Verificar se a capability tem a propriedade 'enabled'
  if (typeof cap === 'object' && cap !== null && 'enabled' in cap) {
    return cap.enabled;
  }

  // Para capabilities que não têm 'enabled' (como maxContextWindow)
  return Boolean(cap);
}
