// frontend/src/hooks/__tests__/useRegionalCertifications.test.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Testes Unitários - useRegionalCertifications Hook
 *
 * Testa todos os hooks relacionados a certificações regionais:
 * - useRegionalCertifications
 * - useRegionalCertification
 * - useIsFullyCertified
 * - useRegionalCertificationStats
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import '@testing-library/jest-dom';
import {
  useRegionalCertifications,
  useRegionalCertification,
  useIsFullyCertified,
  useRegionalCertificationStats
} from '../useRegionalCertifications';
import type { RegionalCertification, AWSRegion } from '../../types/ai';
import { waitForNextUpdate } from '../../__tests__/helpers';
import { createTestQueryClient } from '../../__tests__/setup';

// Mock COMPLETO do módulo certificationService
vi.mock('../../services/certificationService', () => ({
  certificationService: {
    getAllRegionalCertifications: vi.fn(),
    getRegionalCertification: vi.fn()
  }
}));

// Importar APÓS o mock
import { certificationService } from '../../services/certificationService';

// Dados de teste
const mockCertifications: RegionalCertification[] = [
  {
    region: 'us-east-1' as AWSRegion,
    status: 'certified',
    lastTestedAt: '2024-01-15T10:00:00Z',
    attempts: 5,
    successRate: 100
  },
  {
    region: 'us-west-2' as AWSRegion,
    status: 'certified',
    lastTestedAt: '2024-01-15T10:05:00Z',
    attempts: 3,
    successRate: 100
  },
  {
    region: 'eu-west-1' as AWSRegion,
    status: 'failed',
    lastTestedAt: '2024-01-15T10:10:00Z',
    attempts: 2,
    successRate: 0,
    error: 'Model not available in this region',
    errorCategory: 'UNAVAILABLE'
  },
  {
    region: 'ap-southeast-1' as AWSRegion,
    status: 'quality_warning',
    lastTestedAt: '2024-01-15T10:15:00Z',
    attempts: 4,
    successRate: 75
  },
  {
    region: 'us-east-1' as AWSRegion,
    status: 'not_tested',
    attempts: 0,
    successRate: 0
  }
];

// QueryClient compartilhado para todos os testes
let queryClient: QueryClient;

// Wrapper para React Query
function createWrapper() {
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useRegionalCertifications', () => {
  beforeAll(() => {
    // Setup global para todos os testes
  });

  beforeEach(() => {
    // Criar novo QueryClient com configuração forçada para testes
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
          refetchOnWindowFocus: false,
          refetchOnMount: true, // FORÇAR refetch ao montar
          refetchOnReconnect: false,
        },
      },
    });
    
    // FORÇAR configurações para a query específica (sobrescreve configurações do hook)
    queryClient.setQueryDefaults(['regionalCertifications'], {
      refetchOnMount: true,
      staleTime: 0,
      gcTime: 0,
    });
    
    // Limpar todos os mocks
    vi.clearAllMocks();
    
    // Resetar implementação do mock
    vi.mocked(certificationService.getAllRegionalCertifications).mockReset();
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it('deve buscar certificações de todas as regiões', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertifications('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Assert - Estado inicial
    expect(result.current.isLoading).toBe(true);
    expect(result.current.certifications).toEqual([]);

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert - Após carregar
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.certifications).toEqual(mockCertifications);
    expect(result.current.error).toBeNull();
    expect(certificationService.getAllRegionalCertifications).toHaveBeenCalledWith(
      'anthropic:claude-3-5-sonnet',
      'aws-bedrock'
    );
    expect(certificationService.getAllRegionalCertifications).toHaveBeenCalledTimes(1);
  });

  it('deve cachear resultados por 5 minutos', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act - Primeira renderização
    const { result: result1, unmount: unmount1 } = renderHook(
      () => useRegionalCertifications('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    await waitForNextUpdate();

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    unmount1();

    // Act - Segunda renderização (deve usar cache)
    const { result: result2 } = renderHook(
      () => useRegionalCertifications('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Assert - Deve ter chamado apenas uma vez (cache funcionando)
    await waitFor(() => {
      expect(result2.current.isLoading).toBe(false);
    });

    expect(certificationService.getAllRegionalCertifications).toHaveBeenCalledTimes(1);
  });

  it('deve fazer auto-refresh a cada 30 segundos quando habilitado', async () => {
    // Arrange
    vi.useFakeTimers();
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertifications('anthropic:claude-3-5-sonnet', 'aws-bedrock', {
        autoRefresh: true,
        refreshInterval: 30000
      }),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert - Primeira chamada
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(certificationService.getAllRegionalCertifications).toHaveBeenCalledTimes(1);

    // Avançar 30 segundos
    vi.advanceTimersByTime(30000);

    await waitForNextUpdate();

    // Assert - Segunda chamada (auto-refresh)
    await waitFor(() => {
      expect(certificationService.getAllRegionalCertifications).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });

  it('deve lidar com erros de API', async () => {
    // Arrange
    const mockError = new Error('API Error: Network failure');
    vi.mocked(certificationService.getAllRegionalCertifications).mockRejectedValue(mockError);

    // Act
    const { result } = renderHook(
      () => useRegionalCertifications('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.certifications).toEqual([]);
  });

  it('deve retornar loading state correto', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockCertifications), 100))
    );

    // Act
    const { result } = renderHook(
      () => useRegionalCertifications('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Assert - Durante carregamento
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetching).toBe(true);

    // Assert - Após carregamento
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('deve desabilitar auto-refresh quando enabled=false', async () => {
    // Arrange
    vi.useFakeTimers();
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertifications('anthropic:claude-3-5-sonnet', 'aws-bedrock', {
        autoRefresh: false
      }),
      { wrapper: createWrapper() }
    );

    // Assert - Primeira chamada
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(certificationService.getAllRegionalCertifications).toHaveBeenCalledTimes(1);

    // Avançar 30 segundos
    vi.advanceTimersByTime(30000);

    // Assert - Não deve ter chamado novamente
    expect(certificationService.getAllRegionalCertifications).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('deve invalidar cache quando forçado refetch', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertifications('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    await waitForNextUpdate();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(certificationService.getAllRegionalCertifications).toHaveBeenCalledTimes(1);

    // Forçar refetch
    result.current.refetch();

    await waitForNextUpdate();

    // Assert - Deve ter chamado novamente
    await waitFor(() => {
      expect(certificationService.getAllRegionalCertifications).toHaveBeenCalledTimes(2);
    });
  });

  it('não deve executar query quando modelId ou providerId são null', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertifications(null, null),
      { wrapper: createWrapper() }
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isEnabled).toBe(false);
    expect(certificationService.getAllRegionalCertifications).not.toHaveBeenCalled();
  });

  it('não deve executar query quando enabled=false', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertifications('anthropic:claude-3-5-sonnet', 'aws-bedrock', {
        enabled: false
      }),
      { wrapper: createWrapper() }
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isEnabled).toBe(false);
    expect(certificationService.getAllRegionalCertifications).not.toHaveBeenCalled();
  });
});

describe('useRegionalCertification', () => {
  beforeEach(() => {
    // Criar novo QueryClient com configuração forçada para testes
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
          refetchOnWindowFocus: false,
          refetchOnMount: true, // FORÇAR refetch ao montar
          refetchOnReconnect: false,
        },
      },
    });
    
    // FORÇAR configurações para a query específica (sobrescreve configurações do hook)
    queryClient.setQueryDefaults(['regionalCertifications'], {
      refetchOnMount: true,
      staleTime: 0,
      gcTime: 0,
    });
    
    vi.clearAllMocks();
    vi.mocked(certificationService.getAllRegionalCertifications).mockReset();
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  it('deve buscar certificação de região específica', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertification('anthropic:claude-3-5-sonnet', 'aws-bedrock', 'us-east-1'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    expect(result.current).toEqual(mockCertifications[0]);
    expect(result.current?.region).toBe('us-east-1');
    expect(result.current?.status).toBe('certified');
  });

  it('deve retornar null para região não encontrada', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertification('anthropic:claude-3-5-sonnet', 'aws-bedrock', 'ap-northeast-1' as AWSRegion),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('deve cachear por região', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act - Buscar mesma região duas vezes
    const { result: result1 } = renderHook(
      () => useRegionalCertification('anthropic:claude-3-5-sonnet', 'aws-bedrock', 'us-east-1'),
      { wrapper: createWrapper() }
    );

    await waitForNextUpdate();

    await waitFor(() => {
      expect(result1.current).not.toBeNull();
    });

    const { result: result2 } = renderHook(
      () => useRegionalCertification('anthropic:claude-3-5-sonnet', 'aws-bedrock', 'us-east-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result2.current).not.toBeNull();
    });

    // Assert - Deve ter chamado apenas uma vez (cache)
    expect(certificationService.getAllRegionalCertifications).toHaveBeenCalledTimes(1);
  });
});

describe('useIsFullyCertified', () => {
  beforeEach(() => {
    // Criar novo QueryClient com configuração forçada para testes
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
          refetchOnWindowFocus: false,
          refetchOnMount: true, // FORÇAR refetch ao montar
          refetchOnReconnect: false,
        },
      },
    });
    
    // FORÇAR configurações para a query específica (sobrescreve configurações do hook)
    queryClient.setQueryDefaults(['regionalCertifications'], {
      refetchOnMount: true,
      staleTime: 0,
      gcTime: 0,
    });
    
    vi.clearAllMocks();
    vi.mocked(certificationService.getAllRegionalCertifications).mockReset();
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  it('deve retornar true quando todas as regiões certificadas', async () => {
    // Arrange
    const allCertified: RegionalCertification[] = [
      { ...mockCertifications[0], status: 'certified' },
      { ...mockCertifications[1], status: 'certified' },
      { ...mockCertifications[2], status: 'certified' }
    ];
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(allCertified);

    // Act
    const { result } = renderHook(
      () => useIsFullyCertified('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('deve retornar false quando alguma região falhou', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act
    const { result } = renderHook(
      () => useIsFullyCertified('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('deve retornar false quando alguma região não testada', async () => {
    // Arrange
    const withNotTested: RegionalCertification[] = [
      { ...mockCertifications[0], status: 'certified' },
      { ...mockCertifications[1], status: 'not_tested' }
    ];
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(withNotTested);

    // Act
    const { result } = renderHook(
      () => useIsFullyCertified('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('deve retornar false durante loading', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockCertifications), 100))
    );

    // Act
    const { result } = renderHook(
      () => useIsFullyCertified('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Assert - Durante loading
    expect(result.current).toBe(false);
  });

  it('deve retornar false quando não há certificações', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue([]);

    // Act
    const { result } = renderHook(
      () => useIsFullyCertified('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});

describe('useRegionalCertificationStats', () => {
  beforeEach(() => {
    // Criar novo QueryClient com configuração forçada para testes
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
          refetchOnWindowFocus: false,
          refetchOnMount: true, // FORÇAR refetch ao montar
          refetchOnReconnect: false,
        },
      },
    });
    
    // FORÇAR configurações para a query específica (sobrescreve configurações do hook)
    queryClient.setQueryDefaults(['regionalCertifications'], {
      refetchOnMount: true,
      staleTime: 0,
      gcTime: 0,
    });
    
    vi.clearAllMocks();
    vi.mocked(certificationService.getAllRegionalCertifications).mockReset();
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  it('deve calcular estatísticas corretas', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(mockCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertificationStats('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current.totalRegions).toBe(5);
    });

    expect(result.current.certifiedCount).toBe(2);
    expect(result.current.failedCount).toBe(1);
    expect(result.current.warningCount).toBe(1);
    expect(result.current.notTestedCount).toBe(1);
  });

  it('deve contar regiões por status', async () => {
    // Arrange
    const customCertifications: RegionalCertification[] = [
      { ...mockCertifications[0], status: 'certified' },
      { ...mockCertifications[1], status: 'certified' },
      { ...mockCertifications[2], status: 'certified' },
      { ...mockCertifications[3], status: 'failed' },
      { ...mockCertifications[4], status: 'quality_warning' }
    ];
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(customCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertificationStats('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current.certifiedCount).toBe(3);
    });

    expect(result.current.failedCount).toBe(1);
    expect(result.current.warningCount).toBe(1);
    expect(result.current.notTestedCount).toBe(0);
  });

  it('deve calcular percentual de certificação', async () => {
    // Arrange
    const customCertifications: RegionalCertification[] = [
      { ...mockCertifications[0], status: 'certified' },
      { ...mockCertifications[1], status: 'certified' },
      { ...mockCertifications[2], status: 'failed' },
      { ...mockCertifications[3], status: 'failed' }
    ];
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(customCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertificationStats('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current.certificationRate).toBe(50); // 2/4 = 50%
    });
  });

  it('deve retornar zeros durante loading', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockCertifications), 100))
    );

    // Act
    const { result } = renderHook(
      () => useRegionalCertificationStats('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Assert - Durante loading
    expect(result.current.totalRegions).toBe(0);
    expect(result.current.certifiedCount).toBe(0);
    expect(result.current.failedCount).toBe(0);
    expect(result.current.warningCount).toBe(0);
    expect(result.current.notTestedCount).toBe(0);
    expect(result.current.certificationRate).toBe(0);
  });

  it('deve retornar zeros quando não há certificações', async () => {
    // Arrange
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue([]);

    // Act
    const { result } = renderHook(
      () => useRegionalCertificationStats('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current.totalRegions).toBe(0);
    });

    expect(result.current.certificationRate).toBe(0);
  });

  it('deve contar configuration_required e permission_required como falhas', async () => {
    // Arrange
    const customCertifications: RegionalCertification[] = [
      { ...mockCertifications[0], status: 'certified' },
      { ...mockCertifications[1], status: 'configuration_required' },
      { ...mockCertifications[2], status: 'permission_required' },
      { ...mockCertifications[3], status: 'failed' }
    ];
    vi.mocked(certificationService.getAllRegionalCertifications).mockResolvedValue(customCertifications);

    // Act
    const { result } = renderHook(
      () => useRegionalCertificationStats('anthropic:claude-3-5-sonnet', 'aws-bedrock'),
      { wrapper: createWrapper() }
    );

    // Aguardar promises resolverem
    await waitForNextUpdate();

    // Assert
    await waitFor(() => {
      expect(result.current.failedCount).toBe(3); // configuration_required + permission_required + failed
    });
  });
});
