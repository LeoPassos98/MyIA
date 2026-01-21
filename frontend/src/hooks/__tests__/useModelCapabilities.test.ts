/**
 * Testes unitários para useModelCapabilities
 * 
 * Testa o comportamento do hook em diferentes cenários:
 * - Parâmetros null/inválidos
 * - Fetch bem-sucedido
 * - Cache funcionando
 * - Tratamento de erros (404, 500, network)
 * - Loading states
 * - Refetch
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useModelCapabilities } from '../useModelCapabilities';
import * as modelsApi from '../../services/api/modelsApi';
import type { ModelCapabilities } from '../../types/capabilities';
import { createElement, type ReactNode } from 'react';

// Mock do serviço de API
vi.mock('../../services/api/modelsApi');

// Capabilities de exemplo para testes
const mockCapabilities: ModelCapabilities = {
  temperature: {
    enabled: true,
    min: 0,
    max: 1,
    default: 0.7,
  },
  topK: {
    enabled: false,
  },
  topP: {
    enabled: true,
    min: 0,
    max: 1,
    default: 0.95,
  },
  maxTokens: {
    enabled: true,
    min: 1,
    max: 4096,
    default: 1024,
  },
  stopSequences: {
    enabled: true,
    max: 4,
  },
  streaming: {
    enabled: true,
  },
  vision: {
    enabled: false,
  },
  functionCalling: {
    enabled: true,
  },
  systemPrompt: {
    enabled: true,
  },
  maxContextWindow: 200000,
  maxOutputTokens: 4096,
  requiresInferenceProfile: false,
};

// Wrapper com QueryClient para testes
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Desabilitar retry nos testes
        gcTime: Infinity, // Manter cache durante os testes
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useModelCapabilities', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    vi.clearAllMocks();
  });

  it('deve retornar null quando provider é null', () => {
    const { result } = renderHook(
      () => useModelCapabilities(null, 'claude-3-5-sonnet-20241022'),
      { wrapper: createWrapper() }
    );

    expect(result.current.capabilities).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isEnabled).toBe(false);
  });

  it('deve retornar null quando modelId é null', () => {
    const { result } = renderHook(
      () => useModelCapabilities('anthropic', null),
      { wrapper: createWrapper() }
    );

    expect(result.current.capabilities).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isEnabled).toBe(false);
  });

  it('deve retornar null quando ambos os parâmetros são null', () => {
    const { result } = renderHook(
      () => useModelCapabilities(null, null),
      { wrapper: createWrapper() }
    );

    expect(result.current.capabilities).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isEnabled).toBe(false);
  });

  it('deve fazer fetch quando parâmetros são válidos', async () => {
    // Mock da API retornando capabilities
    vi.mocked(modelsApi.fetchModelCapabilities).mockResolvedValue(mockCapabilities);

    const { result } = renderHook(
      () => useModelCapabilities('anthropic', 'claude-3-5-sonnet-20241022'),
      { wrapper: createWrapper() }
    );

    // Inicialmente deve estar loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.capabilities).toBeNull();

    // Aguardar fetch completar
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar que capabilities foram carregadas
    expect(result.current.capabilities).toEqual(mockCapabilities);
    expect(result.current.error).toBeNull();
    expect(modelsApi.fetchModelCapabilities).toHaveBeenCalledWith('anthropic:claude-3-5-sonnet-20241022');
  });

  it('deve retornar capabilities do cache em chamadas subsequentes', async () => {
    // Mock da API
    vi.mocked(modelsApi.fetchModelCapabilities).mockResolvedValue(mockCapabilities);

    const wrapper = createWrapper();

    // Primeira chamada
    const { result: result1 } = renderHook(
      () => useModelCapabilities('anthropic', 'claude-3-5-sonnet-20241022'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    expect(result1.current.capabilities).toEqual(mockCapabilities);

    // Segunda chamada (deve usar cache)
    const { result: result2 } = renderHook(
      () => useModelCapabilities('anthropic', 'claude-3-5-sonnet-20241022'),
      { wrapper }
    );

    // Não deve estar loading (usa cache)
    expect(result2.current.isLoading).toBe(false);
    expect(result2.current.capabilities).toEqual(mockCapabilities);

    // API deve ter sido chamada apenas uma vez
    expect(modelsApi.fetchModelCapabilities).toHaveBeenCalledTimes(1);
  });

  it('deve tratar erro 404 gracefully', async () => {
    // Mock da API retornando erro 404
    const error404 = {
      message: 'Model not found: anthropic:invalid-model',
      status: 404,
      code: 'MODEL_NOT_FOUND',
    };
    vi.mocked(modelsApi.fetchModelCapabilities).mockRejectedValue(error404);

    const { result } = renderHook(
      () => useModelCapabilities('anthropic', 'invalid-model'),
      { wrapper: createWrapper() }
    );

    // Aguardar erro aparecer (React Query faz retry, então aguardamos o erro)
    await waitFor(
      () => {
        expect(result.current.error).not.toBeNull();
      },
      { timeout: 5000 }
    );

    // Verificar estado de erro
    expect(result.current.capabilities).toBeNull();
    expect(result.current.error).toEqual(error404);
  });

  it('deve tratar erro 500 gracefully', async () => {
    // Mock da API retornando erro 500
    const error500 = {
      message: 'Internal server error',
      status: 500,
      code: 'SERVER_ERROR',
    };
    vi.mocked(modelsApi.fetchModelCapabilities).mockRejectedValue(error500);

    const { result } = renderHook(
      () => useModelCapabilities('anthropic', 'claude-3-5-sonnet-20241022'),
      { wrapper: createWrapper() }
    );

    // Aguardar erro aparecer (React Query faz retry, então aguardamos o erro)
    await waitFor(
      () => {
        expect(result.current.error).not.toBeNull();
      },
      { timeout: 5000 }
    );

    // Verificar estado de erro
    expect(result.current.capabilities).toBeNull();
    expect(result.current.error).toEqual(error500);
  });

  it('deve tratar erro de network gracefully', async () => {
    // Mock da API retornando erro de rede
    const networkError = {
      message: 'Network error',
      code: 'NETWORK_ERROR',
    };
    vi.mocked(modelsApi.fetchModelCapabilities).mockRejectedValue(networkError);

    const { result } = renderHook(
      () => useModelCapabilities('anthropic', 'claude-3-5-sonnet-20241022'),
      { wrapper: createWrapper() }
    );

    // Aguardar erro aparecer (React Query faz retry, então aguardamos o erro)
    await waitFor(
      () => {
        expect(result.current.error).not.toBeNull();
      },
      { timeout: 5000 }
    );

    // Verificar estado de erro
    expect(result.current.capabilities).toBeNull();
    expect(result.current.error).toEqual(networkError);
  });

  it('deve ter loading state correto durante fetch', async () => {
    // Mock da API com delay
    vi.mocked(modelsApi.fetchModelCapabilities).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockCapabilities), 100))
    );

    const { result } = renderHook(
      () => useModelCapabilities('anthropic', 'claude-3-5-sonnet-20241022'),
      { wrapper: createWrapper() }
    );

    // Inicialmente loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetching).toBe(true);
    expect(result.current.capabilities).toBeNull();

    // Aguardar completar
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Após completar
    expect(result.current.isFetching).toBe(false);
    expect(result.current.capabilities).toEqual(mockCapabilities);
  });

  it('deve permitir refetch manual', async () => {
    // Mock da API
    vi.mocked(modelsApi.fetchModelCapabilities).mockResolvedValue(mockCapabilities);

    const { result } = renderHook(
      () => useModelCapabilities('anthropic', 'claude-3-5-sonnet-20241022'),
      { wrapper: createWrapper() }
    );

    // Aguardar primeiro fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(modelsApi.fetchModelCapabilities).toHaveBeenCalledTimes(1);

    // Chamar refetch
    result.current.refetch();

    // Aguardar refetch completar
    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // API deve ter sido chamada novamente
    expect(modelsApi.fetchModelCapabilities).toHaveBeenCalledTimes(2);
    expect(result.current.capabilities).toEqual(mockCapabilities);
  });

  it('deve construir fullModelId corretamente', async () => {
    vi.mocked(modelsApi.fetchModelCapabilities).mockResolvedValue(mockCapabilities);

    renderHook(
      () => useModelCapabilities('amazon', 'nova-pro-v1:0'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(modelsApi.fetchModelCapabilities).toHaveBeenCalledWith('amazon:nova-pro-v1:0');
    });
  });
});
