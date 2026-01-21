/**
 * Testes unitários para useCertificationDetails
 * 
 * Testa o comportamento do hook em diferentes cenários:
 * - Parâmetros null/inválidos
 * - Fetch bem-sucedido
 * - Cache funcionando
 * - Tratamento de erros (404, 500, network)
 * - Loading states
 * - Hooks auxiliares (useIsModelCertified, useCertificationStatus)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCertificationDetails,
  useIsModelCertified,
  useCertificationStatus,
} from '../useCertificationDetails';
import * as certificationService from '../../services/certificationService';
import type { CertificationDetails } from '../../types/ai';
import { createElement, type ReactNode } from 'react';

// Mock do serviço de certificação
vi.mock('../../services/certificationService');

// Detalhes de certificação de exemplo para testes
const mockCertificationDetails: CertificationDetails = {
  modelId: 'anthropic:claude-3-5-sonnet-20241022',
  status: 'certified',
  lastChecked: '2026-01-20T10:00:00Z',
  isAvailable: true,
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

describe('useCertificationDetails', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    vi.clearAllMocks();
  });

  it('retorna null quando modelId é null', () => {
    const { result } = renderHook(() => useCertificationDetails(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.certificationDetails).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isEnabled).toBe(false);
  });

  it('faz fetch quando modelId é válido', async () => {
    // Mock do serviço retornando detalhes
    vi.mocked(certificationService.certificationService.getCertificationDetails).mockResolvedValue(
      mockCertificationDetails
    );

    const { result } = renderHook(
      () => useCertificationDetails('anthropic:claude-3-5-sonnet-20241022'),
      {
        wrapper: createWrapper(),
      }
    );

    // Inicialmente deve estar loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.certificationDetails).toBeNull();

    // Aguardar fetch completar
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar que detalhes foram carregados
    expect(result.current.certificationDetails).toMatchObject(mockCertificationDetails);
    expect(result.current.error).toBeNull();
    expect(certificationService.certificationService.getCertificationDetails).toHaveBeenCalledWith(
      'anthropic:claude-3-5-sonnet-20241022'
    );
  });

  it('retorna dados corretos do cache em chamadas subsequentes', async () => {
    // Mock do serviço
    vi.mocked(certificationService.certificationService.getCertificationDetails).mockResolvedValue(
      mockCertificationDetails
    );

    const wrapper = createWrapper();

    // Primeira chamada
    const { result: result1 } = renderHook(
      () => useCertificationDetails('anthropic:claude-3-5-sonnet-20241022'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    expect(result1.current.certificationDetails).toMatchObject(mockCertificationDetails);

    // Segunda chamada (deve usar cache)
    const { result: result2 } = renderHook(
      () => useCertificationDetails('anthropic:claude-3-5-sonnet-20241022'),
      { wrapper }
    );

    // Não deve estar loading (usa cache)
    expect(result2.current.isLoading).toBe(false);
    expect(result2.current.certificationDetails).toMatchObject(mockCertificationDetails);

    // Serviço deve ter sido chamado apenas uma vez
    expect(certificationService.certificationService.getCertificationDetails).toHaveBeenCalledTimes(1);
  });

  it('trata erro 404 gracefully', async () => {
    // Mock do serviço retornando null (modelo não encontrado)
    vi.mocked(certificationService.certificationService.getCertificationDetails).mockResolvedValue(null);

    const { result } = renderHook(
      () => useCertificationDetails('anthropic:invalid-model'),
      {
        wrapper: createWrapper(),
      }
    );

    // Aguardar fetch completar
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar que retornou null sem erro
    expect(result.current.certificationDetails).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('trata erro de rede gracefully', async () => {
    // Mock do serviço lançando erro
    const networkError = new Error('Network error');
    vi.mocked(certificationService.certificationService.getCertificationDetails).mockRejectedValue(
      networkError
    );

    const { result } = renderHook(
      () => useCertificationDetails('anthropic:claude-3-5-sonnet-20241022'),
      {
        wrapper: createWrapper(),
      }
    );

    // Aguardar erro aparecer
    await waitFor(
      () => {
        expect(result.current.error).not.toBeNull();
      },
      { timeout: 5000 }
    );

    // Verificar estado de erro
    expect(result.current.certificationDetails).toBeNull();
    expect(result.current.error).toBeDefined();
  });

  it('permite refetch manual', async () => {
    // Mock do serviço
    vi.mocked(certificationService.certificationService.getCertificationDetails).mockResolvedValue(
      mockCertificationDetails
    );

    const { result } = renderHook(
      () => useCertificationDetails('anthropic:claude-3-5-sonnet-20241022'),
      {
        wrapper: createWrapper(),
      }
    );

    // Aguardar primeiro fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(certificationService.certificationService.getCertificationDetails).toHaveBeenCalledTimes(1);

    // Chamar refetch
    result.current.refetch();

    // Aguardar refetch completar
    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // Serviço deve ter sido chamado novamente
    expect(certificationService.certificationService.getCertificationDetails).toHaveBeenCalledTimes(2);
    expect(result.current.certificationDetails).toMatchObject(mockCertificationDetails);
  });
});

describe('useIsModelCertified', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna false quando modelId é null', () => {
    const { result } = renderHook(() => useIsModelCertified(null), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe(false);
  });

  it('retorna true quando modelo está certificado', async () => {
    vi.mocked(certificationService.certificationService.getCertificationDetails).mockResolvedValue(
      mockCertificationDetails
    );

    const { result } = renderHook(
      () => useIsModelCertified('anthropic:claude-3-5-sonnet-20241022'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('retorna false quando modelo não está certificado', async () => {
    const qualityWarningDetails: CertificationDetails = {
      ...mockCertificationDetails,
      status: 'quality_warning',
    };

    vi.mocked(certificationService.certificationService.getCertificationDetails).mockResolvedValue(
      qualityWarningDetails
    );

    const { result } = renderHook(
      () => useIsModelCertified('test-model'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('retorna false quando há erro', async () => {
    vi.mocked(certificationService.certificationService.getCertificationDetails).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(
      () => useIsModelCertified('anthropic:claude-3-5-sonnet-20241022'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current).toBe(false));
  });
});

describe('useCertificationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna "not_tested" quando modelId é null', () => {
    const { result } = renderHook(() => useCertificationStatus(null), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe('not_tested');
  });

  it('retorna "certified" quando modelo está certificado', async () => {
    vi.mocked(certificationService.certificationService.getCertificationDetails).mockResolvedValue(
      mockCertificationDetails
    );

    const { result } = renderHook(
      () => useCertificationStatus('anthropic:claude-3-5-sonnet-20241022'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current).toBe('certified'));
  });

  it('retorna "quality_warning" quando modelo tem warning', async () => {
    const qualityWarningDetails: CertificationDetails = {
      ...mockCertificationDetails,
      status: 'quality_warning',
    };

    vi.mocked(certificationService.certificationService.getCertificationDetails).mockResolvedValue(
      qualityWarningDetails
    );

    const { result } = renderHook(
      () => useCertificationStatus('test-model'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current).toBe('quality_warning'));
  });

  it('retorna "failed" quando modelo falhou', async () => {
    const failedDetails: CertificationDetails = {
      ...mockCertificationDetails,
      status: 'failed',
    };

    vi.mocked(certificationService.certificationService.getCertificationDetails).mockResolvedValue(
      failedDetails
    );

    const { result } = renderHook(
      () => useCertificationStatus('test-model'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current).toBe('failed'));
  });

  it('retorna "not_tested" quando há erro', async () => {
    vi.mocked(certificationService.certificationService.getCertificationDetails).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(
      () => useCertificationStatus('anthropic:claude-3-5-sonnet-20241022'),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current).toBe('not_tested'));
  });
});
