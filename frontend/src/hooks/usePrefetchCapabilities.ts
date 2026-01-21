// frontend/src/hooks/usePrefetchCapabilities.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * usePrefetchCapabilities Hook
 *
 * Hook para prefetch de capabilities de todos os modelos disponíveis.
 * Executa em background ao montar o app, populando o cache do React Query.
 * Usuário não precisa esperar ao trocar de modelo.
 *
 * @module hooks/usePrefetchCapabilities
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchAllCapabilities } from '../services/api/modelsApi';
import type { ModelCapabilities } from '../types/capabilities';

/**
 * Resultado do hook usePrefetchCapabilities
 */
export interface UsePrefetchCapabilitiesResult {
  /** Indica se o prefetch está em andamento */
  isPrefetching: boolean;
  /** Erro ocorrido durante o prefetch (null se sem erro) */
  error: Error | null;
  /** Número de modelos cujas capabilities foram carregadas */
  prefetchedCount: number;
}

/**
 * Hook para prefetch de capabilities de todos os modelos
 * 
 * Executa automaticamente ao montar o componente, buscando capabilities
 * de todos os modelos disponíveis e populando o cache do React Query.
 * 
 * Características:
 * - Executa apenas uma vez ao montar
 * - Não bloqueia a UI (executa em background)
 * - Popula o cache para uso instantâneo do useModelCapabilities
 * - Trata erros gracefully (não quebra o app se falhar)
 * 
 * @param options - Opções de configuração
 * @param options.enabled - Se o prefetch deve ser executado (default: true)
 * @param options.onSuccess - Callback executado após sucesso
 * @param options.onError - Callback executado em caso de erro
 * @returns Objeto com estado do prefetch
 * 
 * @example
 * ```typescript
 * // Uso básico no App.tsx
 * function App() {
 *   const { isPrefetching, prefetchedCount } = usePrefetchCapabilities();
 *   
 *   console.log(`Prefetched ${prefetchedCount} models`);
 *   
 *   return <YourApp />;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Com callbacks
 * usePrefetchCapabilities({
 *   enabled: true,
 *   onSuccess: (count) => {
 *     console.log(`Successfully prefetched ${count} models`);
 *   },
 *   onError: (error) => {
 *     console.error('Prefetch failed:', error);
 *   },
 * });
 * ```
 */
export function usePrefetchCapabilities(options?: {
  enabled?: boolean;
  onSuccess?: (count: number) => void;
  onError?: (error: Error) => void;
}): UsePrefetchCapabilitiesResult {
  const queryClient = useQueryClient();
  const enabled = options?.enabled ?? true;

  // Estado local para tracking
  const [state, setState] = React.useState<{
    isPrefetching: boolean;
    error: Error | null;
    prefetchedCount: number;
  }>({
    isPrefetching: false,
    error: null,
    prefetchedCount: 0,
  });

  useEffect(() => {
    // Só executa se enabled
    if (!enabled) return;

    // Flag para evitar race conditions
    let isMounted = true;

    const prefetchCapabilities = async () => {
      // Verificar se já existe cache
      const existingCache = queryClient.getQueryData(['allCapabilities']);
      if (existingCache) {
        // Já foi feito prefetch, não fazer novamente
        return;
      }

      setState((prev) => ({ ...prev, isPrefetching: true, error: null }));

      try {
        // Buscar todas as capabilities
        const allCapabilities = await fetchAllCapabilities();

        if (!isMounted) return;

        // Popular o cache do React Query para cada modelo
        let count = 0;
        for (const [modelId, capabilities] of Object.entries(allCapabilities)) {
          queryClient.setQueryData<ModelCapabilities>(
            ['modelCapabilities', modelId],
            capabilities,
            {
              // Mesmas configurações do useModelCapabilities
              updatedAt: Date.now(),
            }
          );
          count++;
        }

        // Cachear também a resposta completa
        queryClient.setQueryData(['allCapabilities'], allCapabilities);

        setState({
          isPrefetching: false,
          error: null,
          prefetchedCount: count,
        });

        // Chamar callback de sucesso
        options?.onSuccess?.(count);

        console.log(`[usePrefetchCapabilities] Successfully prefetched ${count} models`);
      } catch (error) {
        if (!isMounted) return;

        const err = error instanceof Error ? error : new Error('Unknown error');
        
        setState({
          isPrefetching: false,
          error: err,
          prefetchedCount: 0,
        });

        // Chamar callback de erro
        options?.onError?.(err);

        // Log do erro mas não quebra o app
        console.error('[usePrefetchCapabilities] Failed to prefetch capabilities:', err);
      }
    };

    // Executar prefetch
    prefetchCapabilities();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [enabled, queryClient, options?.onSuccess, options?.onError]);

  return state;
}

/**
 * Hook auxiliar para invalidar o cache de capabilities
 * 
 * Útil quando há mudanças no backend que requerem atualização do cache.
 * 
 * @returns Função para invalidar o cache
 * 
 * @example
 * ```typescript
 * const invalidateCapabilities = useInvalidateCapabilities();
 * 
 * const handleModelUpdate = async () => {
 *   await updateModel();
 *   invalidateCapabilities(); // Forçar refetch
 * };
 * ```
 */
export function useInvalidateCapabilities(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    // Invalidar todas as queries de capabilities
    await queryClient.invalidateQueries({
      queryKey: ['modelCapabilities'],
    });
    await queryClient.invalidateQueries({
      queryKey: ['allCapabilities'],
    });
  };
}

// Import React para useState
import React from 'react';
