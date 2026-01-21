/**
 * Testes unitários para useCostEstimate
 * 
 * Testa o comportamento dos hooks de estimativa de custo:
 * - useCostEstimate: estimativa básica
 * - useConversationCostEstimate: estimativa de conversa
 * - useCostComparison: comparação entre modelos
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCostEstimate,
  useConversationCostEstimate,
  useCostComparison,
} from '../useCostEstimate';
import * as useModelCapabilitiesModule from '../useModelCapabilities';
import { createElement, type ReactNode } from 'react';

// Mock do hook useModelCapabilities
vi.mock('../useModelCapabilities');

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
  });

  it('retorna preço não disponível quando provider é null', () => {
    const { result } = renderHook(
      () => useCostEstimate(null, 'claude-3-5-sonnet-20241022', 1000, 2000),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasPricing).toBe(false);
    expect(result.current.formatted).toBe('Preço não disponível');
    expect(result.current.totalCost).toBe(0);
  });

  it('retorna preço não disponível quando modelId é null', () => {
    const { result } = renderHook(
      () => useCostEstimate('anthropic', null, 1000, 2000),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasPricing).toBe(false);
    expect(result.current.formatted).toBe('Preço não disponível');
    expect(result.current.totalCost).toBe(0);
  });

  it('retorna preço não disponível para modelo desconhecido', () => {
    const { result } = renderHook(
      () => useCostEstimate('unknown', 'unknown-model', 1000, 2000),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasPricing).toBe(false);
    expect(result.current.formatted).toBe('Preço não disponível');
    expect(result.current.totalCost).toBe(0);
  });

  it('calcula custo corretamente para Claude 3.5 Sonnet', () => {
    // Preços: input $3/1M, output $15/1M
    // 1000 input tokens = $0.003
    // 2000 output tokens = $0.030
    // Total = $0.033
    const { result } = renderHook(
      () => useCostEstimate('anthropic', 'claude-3-5-sonnet-20241022', 1000, 2000),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.inputCost).toBeCloseTo(0.003, 6);
    expect(result.current.outputCost).toBeCloseTo(0.030, 6);
    expect(result.current.totalCost).toBeCloseTo(0.033, 6);
    expect(result.current.currency).toBe('USD');
    expect(result.current.formatted).toBe('$0.033');
  });

  it('calcula custo corretamente para GPT-3.5 Turbo', () => {
    // Preços: input $0.5/1M, output $1.5/1M
    // 1000 input tokens = $0.0005
    // 2000 output tokens = $0.0030
    // Total = $0.0035
    const { result } = renderHook(
      () => useCostEstimate('openai', 'gpt-3.5-turbo', 1000, 2000),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.inputCost).toBeCloseTo(0.0005, 6);
    expect(result.current.outputCost).toBeCloseTo(0.0030, 6);
    expect(result.current.totalCost).toBeCloseTo(0.0035, 6);
    expect(result.current.formatted).toBe('$0.0035');
  });

  it('retorna "Gratuito" para modelos Groq', () => {
    const { result } = renderHook(
      () => useCostEstimate('groq', 'llama-3.1-70b-versatile', 1000, 2000),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.totalCost).toBe(0);
    expect(result.current.formatted).toBe('Gratuito');
  });

  it('formata custos muito pequenos corretamente', () => {
    // 10 tokens de entrada e saída = custo muito pequeno
    const { result } = renderHook(
      () => useCostEstimate('anthropic', 'claude-3-haiku-20240307', 10, 10),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.formatted).toBe('< $0.0001');
  });

  it('formata custos médios corretamente', () => {
    // 100K tokens = custo médio
    const { result } = renderHook(
      () => useCostEstimate('anthropic', 'claude-3-5-sonnet-20241022', 50000, 50000),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.totalCost).toBeCloseTo(0.9, 6); // (50K/1M)*3 + (50K/1M)*15
    expect(result.current.formatted).toBe('$0.900');
  });

  it('formata custos grandes corretamente', () => {
    // 1M tokens = custo grande
    const { result } = renderHook(
      () => useCostEstimate('anthropic', 'claude-3-opus-20240229', 500000, 500000),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.totalCost).toBeCloseTo(45.0, 6); // (500K/1M)*15 + (500K/1M)*75
    expect(result.current.formatted).toBe('$45.00');
  });

  it('memoiza o resultado para os mesmos parâmetros', () => {
    const { result, rerender } = renderHook(
      ({ provider, modelId, input, output }) =>
        useCostEstimate(provider, modelId, input, output),
      {
        initialProps: {
          provider: 'anthropic',
          modelId: 'claude-3-5-sonnet-20241022',
          input: 1000,
          output: 2000,
        },
        wrapper: createWrapper(),
      }
    );

    const firstResult = result.current;

    // Rerenderizar com os mesmos parâmetros
    rerender({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      input: 1000,
      output: 2000,
    });

    // Resultado deve ser o mesmo objeto (memoizado)
    expect(result.current).toBe(firstResult);
  });

  it('recalcula quando os tokens mudam', () => {
    const { result, rerender } = renderHook(
      ({ provider, modelId, input, output }) =>
        useCostEstimate(provider, modelId, input, output),
      {
        initialProps: {
          provider: 'anthropic',
          modelId: 'claude-3-5-sonnet-20241022',
          input: 1000,
          output: 2000,
        },
        wrapper: createWrapper(),
      }
    );

    const firstCost = result.current.totalCost;

    // Rerenderizar com tokens diferentes
    rerender({
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      input: 2000,
      output: 4000,
    });

    // Custo deve ser diferente (dobrado)
    expect(result.current.totalCost).toBeCloseTo(firstCost * 2, 6);
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
  });

  it('calcula custo de conversa vazia', () => {
    const { result } = renderHook(
      () =>
        useConversationCostEstimate('anthropic', 'claude-3-5-sonnet-20241022', []),
      { wrapper: createWrapper() }
    );

    expect(result.current.totalCost).toBe(0);
    expect(result.current.formatted).toBe('Gratuito');
  });

  it('calcula custo de conversa com múltiplas mensagens', () => {
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

    expect(result.current.hasPricing).toBe(true);
    expect(result.current.inputCost).toBeCloseTo(0.00075, 6);
    expect(result.current.outputCost).toBeCloseTo(0.0165, 6);
    expect(result.current.totalCost).toBeCloseTo(0.01725, 6);
  });

  it('separa corretamente tokens de user e assistant', () => {
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

    // 1000 input, 2000 output
    expect(result.current.inputCost).toBeCloseTo(0.003, 6);
    expect(result.current.outputCost).toBeCloseTo(0.030, 6);
  });

  it('memoiza o cálculo de tokens', () => {
    const messages = [
      { role: 'user' as const, tokens: 100 },
      { role: 'assistant' as const, tokens: 200 },
    ];

    const { result, rerender } = renderHook(
      ({ msgs }) =>
        useConversationCostEstimate('anthropic', 'claude-3-5-sonnet-20241022', msgs),
      {
        initialProps: { msgs: messages },
        wrapper: createWrapper(),
      }
    );

    const firstResult = result.current;

    // Rerenderizar com o mesmo array
    rerender({ msgs: messages });

    // Resultado deve ser o mesmo (memoizado)
    expect(result.current).toBe(firstResult);
  });
});

describe('useCostComparison', () => {
  it('compara custos entre modelos', () => {
    const models = [
      { provider: 'anthropic', modelId: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { provider: 'anthropic', modelId: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ];

    const { result } = renderHook(
      () => useCostComparison(models, 1000, 2000),
      { wrapper: createWrapper() }
    );

    // Deve retornar 3 estimativas
    expect(result.current).toHaveLength(3);

    // Deve estar ordenado por custo (menor primeiro)
    expect(result.current[0].name).toBe('Claude 3 Haiku'); // Mais barato
    expect(result.current[1].name).toBe('Claude 3.5 Sonnet');
    expect(result.current[2].name).toBe('Claude 3 Opus'); // Mais caro

    // Verificar custos
    expect(result.current[0].totalCost).toBeLessThan(result.current[1].totalCost);
    expect(result.current[1].totalCost).toBeLessThan(result.current[2].totalCost);
  });

  it('inclui modelos sem preço na comparação', () => {
    const models = [
      { provider: 'anthropic', modelId: 'claude-3-haiku-20240307' },
      { provider: 'unknown', modelId: 'unknown-model' },
      { provider: 'groq', modelId: 'llama-3.1-70b-versatile' },
    ];

    const { result } = renderHook(
      () => useCostComparison(models, 1000, 2000),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveLength(3);

    // Modelos gratuitos/sem preço devem vir primeiro
    expect(result.current[0].totalCost).toBe(0); // Groq ou unknown
    expect(result.current[1].totalCost).toBe(0); // Groq ou unknown
    expect(result.current[2].totalCost).toBeGreaterThan(0); // Haiku
  });

  it('preserva informações do modelo na comparação', () => {
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

    expect(result.current[0].provider).toBe('anthropic');
    expect(result.current[0].modelId).toBe('claude-3-5-sonnet-20241022');
    expect(result.current[0].name).toBe('Claude 3.5 Sonnet');
  });

  it('memoiza o resultado', () => {
    const models = [
      { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' },
    ];

    const { result, rerender } = renderHook(
      ({ models, input, output }) => useCostComparison(models, input, output),
      {
        initialProps: { models, input: 1000, output: 2000 },
        wrapper: createWrapper(),
      }
    );

    const firstResult = result.current;

    // Rerenderizar com os mesmos parâmetros
    rerender({ models, input: 1000, output: 2000 });

    // Resultado deve ser o mesmo array (memoizado)
    expect(result.current).toBe(firstResult);
  });

  it('recalcula quando os modelos mudam', () => {
    const models1 = [
      { provider: 'anthropic', modelId: 'claude-3-haiku-20240307' },
    ];

    const models2 = [
      { provider: 'anthropic', modelId: 'claude-3-opus-20240229' },
    ];

    const { result, rerender } = renderHook(
      ({ models, input, output }) => useCostComparison(models, input, output),
      {
        initialProps: { models: models1, input: 1000, output: 2000 },
        wrapper: createWrapper(),
      }
    );

    const firstCost = result.current[0].totalCost;

    // Rerenderizar com modelos diferentes
    rerender({ models: models2, input: 1000, output: 2000 });

    // Custo deve ser diferente (Opus é mais caro que Haiku)
    expect(result.current[0].totalCost).toBeGreaterThan(firstCost);
  });
});
