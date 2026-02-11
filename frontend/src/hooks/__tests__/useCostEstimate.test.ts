/**
 * Testes unitários para useCostEstimate
 * 
 * Testa o comportamento dos hooks de estimativa de custo:
 * - useCostEstimate: estimativa básica
 * - useConversationCostEstimate: estimativa de conversa
 * - useCostComparison: comparação entre modelos
 * 
 * Versão v2: Usa mock do deploymentPricingService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCostEstimate,
  useConversationCostEstimate,
  useCostComparison,
} from '../useCostEstimate';
import * as useModelCapabilitiesModule from '../useModelCapabilities';
import * as deploymentPricingServiceModule from '../../services/deploymentPricingService';
import { createElement, type ReactNode } from 'react';

// Mock do hook useModelCapabilities
vi.mock('../useModelCapabilities');

// Mock do deploymentPricingService
vi.mock('../../services/deploymentPricingService');

// Dados de mock para deployments
const mockDeployments: deploymentPricingServiceModule.Deployment[] = [
  {
    id: '1',
    baseModelId: 'base-1',
    providerId: 'provider-1',
    deploymentId: 'claude-3-5-sonnet-20241022',
    inferenceType: 'ON_DEMAND',
    costPer1MInput: 3.0,
    costPer1MOutput: 15.0,
    isActive: true,
    baseModel: { id: 'base-1', name: 'Claude 3.5 Sonnet', vendor: 'Anthropic' },
    provider: { id: 'provider-1', name: 'Anthropic', slug: 'anthropic' }
  },
  {
    id: '2',
    baseModelId: 'base-2',
    providerId: 'provider-2',
    deploymentId: 'gpt-3.5-turbo',
    inferenceType: 'ON_DEMAND',
    costPer1MInput: 0.5,
    costPer1MOutput: 1.5,
    isActive: true,
    baseModel: { id: 'base-2', name: 'GPT-3.5 Turbo', vendor: 'OpenAI' },
    provider: { id: 'provider-2', name: 'OpenAI', slug: 'openai' }
  },
  {
    id: '3',
    baseModelId: 'base-3',
    providerId: 'provider-3',
    deploymentId: 'llama-3.1-70b-versatile',
    inferenceType: 'ON_DEMAND',
    costPer1MInput: 0.0,
    costPer1MOutput: 0.0,
    isActive: true,
    baseModel: { id: 'base-3', name: 'Llama 3.1 70B', vendor: 'Meta' },
    provider: { id: 'provider-3', name: 'Groq', slug: 'groq' }
  },
  {
    id: '4',
    baseModelId: 'base-4',
    providerId: 'provider-1',
    deploymentId: 'claude-3-haiku-20240307',
    inferenceType: 'ON_DEMAND',
    costPer1MInput: 0.25,
    costPer1MOutput: 1.25,
    isActive: true,
    baseModel: { id: 'base-4', name: 'Claude 3 Haiku', vendor: 'Anthropic' },
    provider: { id: 'provider-1', name: 'Anthropic', slug: 'anthropic' }
  },
  {
    id: '5',
    baseModelId: 'base-5',
    providerId: 'provider-1',
    deploymentId: 'claude-3-opus-20240229',
    inferenceType: 'ON_DEMAND',
    costPer1MInput: 15.0,
    costPer1MOutput: 75.0,
    isActive: true,
    baseModel: { id: 'base-5', name: 'Claude 3 Opus', vendor: 'Anthropic' },
    provider: { id: 'provider-1', name: 'Anthropic', slug: 'anthropic' }
  },
];

// Wrapper com QueryClient para testes
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCostEstimate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock padrão do useModelCapabilities
    vi.mocked(useModelCapabilitiesModule.useModelCapabilities).mockReturnValue({
      capabilities: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
      isEnabled: true,
    });
    
    // Mock do getDeploymentPricing
    vi.mocked(deploymentPricingServiceModule.getDeploymentPricing).mockImplementation(
      async (provider, modelId) => {
        if (!provider || !modelId) return null;
        
        const deployment = mockDeployments.find(d => 
          d.deploymentId === modelId || 
          (d.provider?.slug === provider && d.deploymentId.includes(modelId))
        );
        
        if (!deployment) return null;
        
        return {
          costPer1MInput: deployment.costPer1MInput,
          costPer1MOutput: deployment.costPer1MOutput
        };
      }
    );
    
    // Mock do preloadDeploymentsCache
    vi.mocked(deploymentPricingServiceModule.preloadDeploymentsCache).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('retorna preço não disponível quando provider é null', async () => {
    const { result } = renderHook(
      () => useCostEstimate(null, 'claude-3-5-sonnet-20241022', 1000, 2000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPricing).toBe(false);
    expect(result.current.formatted).toBe('Preço não disponível');
    expect(result.current.totalCost).toBe(0);
  });

  it('retorna preço não disponível quando modelId é null', async () => {
    const { result } = renderHook(
      () => useCostEstimate('anthropic', null, 1000, 2000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPricing).toBe(false);
    expect(result.current.formatted).toBe('Preço não disponível');
    expect(result.current.totalCost).toBe(0);
  });

  it('retorna preço não disponível para modelo desconhecido', async () => {
    const { result } = renderHook(
      () => useCostEstimate('unknown', 'unknown-model', 1000, 2000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPricing).toBe(false);
    expect(result.current.formatted).toBe('Preço não disponível');
    expect(result.current.totalCost).toBe(0);
  });

  it('calcula custo corretamente para Claude 3.5 Sonnet', async () => {
    // Preços: input $3/1M, output $15/1M
    // 1000 input tokens = $0.003
    // 2000 output tokens = $0.030
    // Total = $0.033
    const { result } = renderHook(
      () => useCostEstimate('anthropic', 'claude-3-5-sonnet-20241022', 1000, 2000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.inputCost).toBeCloseTo(0.003, 6);
    expect(result.current.outputCost).toBeCloseTo(0.030, 6);
    expect(result.current.totalCost).toBeCloseTo(0.033, 6);
    expect(result.current.currency).toBe('USD');
    expect(result.current.formatted).toBe('$0.033');
  });

  it('calcula custo corretamente para GPT-3.5 Turbo', async () => {
    // Preços: input $0.5/1M, output $1.5/1M
    // 1000 input tokens = $0.0005
    // 2000 output tokens = $0.0030
    // Total = $0.0035
    const { result } = renderHook(
      () => useCostEstimate('openai', 'gpt-3.5-turbo', 1000, 2000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.inputCost).toBeCloseTo(0.0005, 6);
    expect(result.current.outputCost).toBeCloseTo(0.0030, 6);
    expect(result.current.totalCost).toBeCloseTo(0.0035, 6);
    expect(result.current.formatted).toBe('$0.0035');
  });

  it('retorna "Gratuito" para modelos Groq', async () => {
    const { result } = renderHook(
      () => useCostEstimate('groq', 'llama-3.1-70b-versatile', 1000, 2000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.totalCost).toBe(0);
    expect(result.current.formatted).toBe('Gratuito');
  });

  it('formata custos muito pequenos corretamente', async () => {
    // 10 tokens de entrada e saída = custo muito pequeno
    const { result } = renderHook(
      () => useCostEstimate('anthropic', 'claude-3-haiku-20240307', 10, 10),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.formatted).toBe('< $0.0001');
  });

  it('formata custos médios corretamente', async () => {
    // 100K tokens = custo médio
    const { result } = renderHook(
      () => useCostEstimate('anthropic', 'claude-3-5-sonnet-20241022', 50000, 50000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.totalCost).toBeCloseTo(0.9, 6); // (50K/1M)*3 + (50K/1M)*15
    expect(result.current.formatted).toBe('$0.900');
  });

  it('formata custos grandes corretamente', async () => {
    // 1M tokens = custo grande
    const { result } = renderHook(
      () => useCostEstimate('anthropic', 'claude-3-opus-20240229', 500000, 500000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.totalCost).toBeCloseTo(45.0, 6); // (500K/1M)*15 + (500K/1M)*75
    expect(result.current.formatted).toBe('$45.00');
  });

  it('mostra estado de loading inicialmente', () => {
    const { result } = renderHook(
      () => useCostEstimate('anthropic', 'claude-3-5-sonnet-20241022', 1000, 2000),
      { wrapper: createWrapper() }
    );

    // Inicialmente deve estar carregando
    expect(result.current.isLoading).toBe(true);
    expect(result.current.formatted).toBe('Carregando...');
  });
});

describe('useConversationCostEstimate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useModelCapabilitiesModule.useModelCapabilities).mockReturnValue({
      capabilities: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
      isEnabled: true,
    });
    
    vi.mocked(deploymentPricingServiceModule.getDeploymentPricing).mockImplementation(
      async (provider, modelId) => {
        if (!provider || !modelId) return null;
        
        const deployment = mockDeployments.find(d => 
          d.deploymentId === modelId || 
          (d.provider?.slug === provider && d.deploymentId.includes(modelId))
        );
        
        if (!deployment) return null;
        
        return {
          costPer1MInput: deployment.costPer1MInput,
          costPer1MOutput: deployment.costPer1MOutput
        };
      }
    );
    
    vi.mocked(deploymentPricingServiceModule.preloadDeploymentsCache).mockResolvedValue();
  });

  it('calcula custo de conversa vazia', async () => {
    const { result } = renderHook(
      () =>
        useConversationCostEstimate('anthropic', 'claude-3-5-sonnet-20241022', []),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totalCost).toBe(0);
    expect(result.current.formatted).toBe('Gratuito');
  });

  it('calcula custo de conversa com múltiplas mensagens', async () => {
    const messages = [
      { role: 'user' as const, tokens: 100 },
      { role: 'assistant' as const, tokens: 500 },
      { role: 'user' as const, tokens: 150 },
      { role: 'assistant' as const, tokens: 600 },
    ];

    // Total: 250 input, 1100 output
    // Claude 3.5 Sonnet: $3/1M input, $15/1M output
    // Cost: (250/1M)*3 + (1100/1M)*15 = 0.00075 + 0.0165 = 0.01725

    const { result } = renderHook(
      () =>
        useConversationCostEstimate(
          'anthropic',
          'claude-3-5-sonnet-20241022',
          messages
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.inputCost).toBeCloseTo(0.00075, 6);
    expect(result.current.outputCost).toBeCloseTo(0.0165, 6);
    expect(result.current.totalCost).toBeCloseTo(0.01725, 6);
  });

  it('separa corretamente tokens de user e assistant', async () => {
    const messages = [
      { role: 'user' as const, tokens: 1000 },
      { role: 'assistant' as const, tokens: 2000 },
    ];

    const { result } = renderHook(
      () =>
        useConversationCostEstimate(
          'anthropic',
          'claude-3-5-sonnet-20241022',
          messages
        ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 1000 input, 2000 output
    expect(result.current.inputCost).toBeCloseTo(0.003, 6);
    expect(result.current.outputCost).toBeCloseTo(0.030, 6);
  });
});

describe('useCostComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(deploymentPricingServiceModule.getActiveDeployments).mockResolvedValue(mockDeployments);
    vi.mocked(deploymentPricingServiceModule.preloadDeploymentsCache).mockResolvedValue();
  });

  it('compara custos entre modelos', async () => {
    const models = [
      { provider: 'anthropic', modelId: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { provider: 'anthropic', modelId: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ];

    const { result } = renderHook(
      () => useCostComparison(models, 1000, 2000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.length).toBe(3);
    });

    // Deve estar ordenado por custo (menor primeiro)
    expect(result.current[0].name).toBe('Claude 3 Haiku'); // Mais barato
    expect(result.current[1].name).toBe('Claude 3.5 Sonnet');
    expect(result.current[2].name).toBe('Claude 3 Opus'); // Mais caro

    // Verificar custos
    expect(result.current[0].totalCost).toBeLessThan(result.current[1].totalCost);
    expect(result.current[1].totalCost).toBeLessThan(result.current[2].totalCost);
  });

  it('inclui modelos sem preço na comparação', async () => {
    const models = [
      { provider: 'anthropic', modelId: 'claude-3-haiku-20240307' },
      { provider: 'unknown', modelId: 'unknown-model' },
      { provider: 'groq', modelId: 'llama-3.1-70b-versatile' },
    ];

    const { result } = renderHook(
      () => useCostComparison(models, 1000, 2000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.length).toBe(3);
    });

    // Ordenação: modelos com preço por custo (menor primeiro), depois modelos sem preço
    // Groq tem preço $0 (menor custo)
    expect(result.current[0].totalCost).toBe(0); // Groq (preço $0)
    expect(result.current[0].hasPricing).toBe(true);
    
    // Haiku tem preço > $0
    expect(result.current[1].totalCost).toBeGreaterThan(0); // Haiku
    expect(result.current[1].hasPricing).toBe(true);
    
    // Unknown não tem preço (vai para o final)
    expect(result.current[2].hasPricing).toBe(false); // Unknown (sem preço)
  });

  it('preserva informações do modelo na comparação', async () => {
    const models = [
      {
        provider: 'anthropic',
        modelId: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
      },
    ];

    const { result } = renderHook(
      () => useCostComparison(models, 1000, 2000),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.length).toBe(1);
    });

    expect(result.current[0].provider).toBe('anthropic');
    expect(result.current[0].modelId).toBe('claude-3-5-sonnet-20241022');
    expect(result.current[0].name).toBe('Claude 3.5 Sonnet');
  });

  it('retorna array vazio enquanto carrega', () => {
    const models = [
      { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' },
    ];

    const { result } = renderHook(
      () => useCostComparison(models, 1000, 2000),
      { wrapper: createWrapper() }
    );

    // Inicialmente deve estar vazio (carregando)
    expect(result.current).toHaveLength(0);
  });
});
