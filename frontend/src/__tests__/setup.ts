import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

/**
 * Cria um QueryClient otimizado para testes
 * - Sem retry para falhas rápidas
 * - Sem cache para testes isolados
 * - Sem stale time para dados sempre frescos
 */
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Desabilitar retry em testes
      gcTime: 0, // Sem garbage collection time (cache) em testes
      staleTime: 0, // Dados sempre considerados stale
      refetchOnWindowFocus: false, // Não refetch ao focar janela
      refetchOnMount: false, // Não refetch ao montar
      refetchOnReconnect: false, // Não refetch ao reconectar
    },
    mutations: {
      retry: false, // Desabilitar retry em mutations
    },
  },
});
