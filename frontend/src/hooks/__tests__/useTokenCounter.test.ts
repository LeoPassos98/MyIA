/**
 * Testes unitários para useTokenCounter
 * 
 * Testa o comportamento dos hooks de contagem de tokens:
 * - useTokenCounter: contagem básica
 * - useMultipleTokenCounter: contagem múltipla
 * - formatTokenCount: formatação
 * - useFormattedTokenCount: contagem + formatação
 * - useTokenLimit: verificação de limites
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useTokenCounter,
  useMultipleTokenCounter,
  formatTokenCount,
  useFormattedTokenCount,
  useTokenLimit,
} from '../useTokenCounter';

describe('useTokenCounter', () => {
  it('retorna 0 para string vazia', () => {
    const { result } = renderHook(() => useTokenCounter(''));
    expect(result.current).toBe(0);
  });

  it('retorna 0 para string com apenas espaços', () => {
    const { result } = renderHook(() => useTokenCounter('   '));
    expect(result.current).toBe(0);
  });

  it('conta tokens corretamente (~4 chars/token)', () => {
    // 20 caracteres = ~5 tokens
    const { result } = renderHook(() => useTokenCounter('Hello, this is a test'));
    expect(result.current).toBe(6); // Math.ceil(22 / 4) = 6
  });

  it('arredonda para cima', () => {
    // 5 caracteres = 1.25 tokens -> arredonda para 2
    const { result } = renderHook(() => useTokenCounter('Hello'));
    expect(result.current).toBe(2); // Math.ceil(5 / 4) = 2
  });

  it('funciona com texto longo', () => {
    const longText = 'a'.repeat(1000); // 1000 caracteres
    const { result } = renderHook(() => useTokenCounter(longText));
    expect(result.current).toBe(250); // 1000 / 4 = 250
  });

  it('funciona com texto em português', () => {
    const portugueseText = 'Olá, como você está hoje?'; // 26 caracteres
    const { result } = renderHook(() => useTokenCounter(portugueseText));
    expect(result.current).toBe(7); // Math.ceil(26 / 4) = 7
  });

  it('memoiza o resultado para o mesmo texto', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTokenCounter(text),
      { initialProps: { text: 'Hello, world!' } }
    );

    const firstResult = result.current;

    // Rerenderizar com o mesmo texto
    rerender({ text: 'Hello, world!' });

    // Resultado deve ser o mesmo (memoizado)
    expect(result.current).toBe(firstResult);
  });

  it('recalcula quando o texto muda', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTokenCounter(text),
      { initialProps: { text: 'Hello' } }
    );

    const firstResult = result.current;

    // Rerenderizar com texto diferente
    rerender({ text: 'Hello, world!' });

    // Resultado deve ser diferente
    expect(result.current).not.toBe(firstResult);
    expect(result.current).toBeGreaterThan(firstResult);
  });
});

describe('useMultipleTokenCounter', () => {
  it('retorna arrays vazios para array vazio', () => {
    const { result } = renderHook(() => useMultipleTokenCounter([]));
    expect(result.current.counts).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('conta múltiplos textos corretamente', () => {
    const texts = ['Hello', 'World', 'Test']; // 5, 5, 4 chars = 2, 2, 1 tokens
    const { result } = renderHook(() => useMultipleTokenCounter(texts));
    
    expect(result.current.counts).toEqual([2, 2, 1]);
    expect(result.current.total).toBe(5);
  });

  it('trata strings vazias corretamente', () => {
    const texts = ['Hello', '', 'World']; // 5, 0, 5 chars = 2, 0, 2 tokens
    const { result } = renderHook(() => useMultipleTokenCounter(texts));
    
    expect(result.current.counts).toEqual([2, 0, 2]);
    expect(result.current.total).toBe(4);
  });

  it('soma total corretamente', () => {
    const texts = ['a'.repeat(100), 'b'.repeat(200), 'c'.repeat(300)]; // 100, 200, 300 chars
    const { result } = renderHook(() => useMultipleTokenCounter(texts));
    
    expect(result.current.counts).toEqual([25, 50, 75]); // 100/4, 200/4, 300/4
    expect(result.current.total).toBe(150); // 25 + 50 + 75
  });

  it('memoiza o resultado para o mesmo array', () => {
    const texts = ['Hello', 'World'];
    const { result, rerender } = renderHook(
      ({ texts }) => useMultipleTokenCounter(texts),
      { initialProps: { texts } }
    );

    const firstResult = result.current;

    // Rerenderizar com o mesmo array
    rerender({ texts });

    // Resultado deve ser o mesmo objeto (memoizado)
    expect(result.current).toBe(firstResult);
  });
});

describe('formatTokenCount', () => {
  it('formata números pequenos sem sufixo K', () => {
    expect(formatTokenCount(0)).toBe('0 tokens');
    expect(formatTokenCount(1)).toBe('1 tokens');
    expect(formatTokenCount(500)).toBe('500 tokens');
    expect(formatTokenCount(999)).toBe('999 tokens');
  });

  it('formata números grandes com sufixo K', () => {
    expect(formatTokenCount(1000)).toBe('1.0K tokens');
    expect(formatTokenCount(1500)).toBe('1.5K tokens');
    expect(formatTokenCount(2000)).toBe('2.0K tokens');
    expect(formatTokenCount(10000)).toBe('10.0K tokens');
  });

  it('arredonda para 1 casa decimal', () => {
    expect(formatTokenCount(1234)).toBe('1.2K tokens');
    expect(formatTokenCount(1567)).toBe('1.6K tokens');
    expect(formatTokenCount(9999)).toBe('10.0K tokens');
  });
});

describe('useFormattedTokenCount', () => {
  it('retorna contagem e formatação para texto pequeno', () => {
    const { result } = renderHook(() => useFormattedTokenCount('Hello')); // 5 chars = 2 tokens
    
    expect(result.current.count).toBe(2);
    expect(result.current.formatted).toBe('2 tokens');
  });

  it('retorna contagem e formatação para texto grande', () => {
    const longText = 'a'.repeat(5000); // 5000 chars = 1250 tokens
    const { result } = renderHook(() => useFormattedTokenCount(longText));
    
    expect(result.current.count).toBe(1250);
    // 1250/1000 = 1.25, toFixed(1) arredonda para 1.3
    expect(result.current.formatted).toBe('1.3K tokens');
  });

  it('retorna 0 para string vazia', () => {
    const { result } = renderHook(() => useFormattedTokenCount(''));
    
    expect(result.current.count).toBe(0);
    expect(result.current.formatted).toBe('0 tokens');
  });

  it('memoiza a formatação', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useFormattedTokenCount(text),
      { initialProps: { text: 'Hello' } }
    );

    const firstFormatted = result.current.formatted;

    // Rerenderizar com o mesmo texto
    rerender({ text: 'Hello' });

    // Formatação deve ser a mesma (memoizada)
    expect(result.current.formatted).toBe(firstFormatted);
  });
});

describe('useTokenLimit', () => {
  it('detecta quando não excede o limite', () => {
    const { result } = renderHook(() => useTokenLimit('Hello', 10)); // 2 tokens, limite 10
    
    expect(result.current.exceeds).toBe(false);
    expect(result.current.count).toBe(2);
    expect(result.current.remaining).toBe(8);
    expect(result.current.percentage).toBe(20); // 2/10 * 100
  });

  it('detecta quando excede o limite', () => {
    const longText = 'a'.repeat(100); // 25 tokens
    const { result } = renderHook(() => useTokenLimit(longText, 10));
    
    expect(result.current.exceeds).toBe(true);
    expect(result.current.count).toBe(25);
    expect(result.current.remaining).toBe(0); // Não pode ser negativo
    expect(result.current.percentage).toBe(100); // Limitado a 100
  });

  it('calcula porcentagem corretamente', () => {
    const text = 'a'.repeat(20); // 5 tokens
    const { result } = renderHook(() => useTokenLimit(text, 10));
    
    expect(result.current.percentage).toBe(50); // 5/10 * 100
  });

  it('limita porcentagem a 100%', () => {
    const longText = 'a'.repeat(200); // 50 tokens
    const { result } = renderHook(() => useTokenLimit(longText, 10));
    
    expect(result.current.percentage).toBe(100); // Limitado a 100
  });

  it('trata limite 0 corretamente', () => {
    const { result } = renderHook(() => useTokenLimit('Hello', 0));
    
    expect(result.current.exceeds).toBe(true);
    expect(result.current.remaining).toBe(0);
    expect(result.current.percentage).toBe(0); // Evita divisão por zero
  });

  it('calcula remaining corretamente', () => {
    const text = 'a'.repeat(12); // 3 tokens
    const { result } = renderHook(() => useTokenLimit(text, 10));
    
    expect(result.current.remaining).toBe(7); // 10 - 3
  });

  it('remaining nunca é negativo', () => {
    const longText = 'a'.repeat(100); // 25 tokens
    const { result } = renderHook(() => useTokenLimit(longText, 10));
    
    expect(result.current.remaining).toBe(0); // Math.max(0, 10 - 25)
  });

  it('memoiza o resultado', () => {
    const { result, rerender } = renderHook(
      ({ text, limit }) => useTokenLimit(text, limit),
      { initialProps: { text: 'Hello', limit: 10 } }
    );

    const firstResult = result.current;

    // Rerenderizar com os mesmos valores
    rerender({ text: 'Hello', limit: 10 });

    // Resultado deve ser o mesmo objeto (memoizado)
    expect(result.current).toBe(firstResult);
  });

  it('recalcula quando o texto muda', () => {
    const { result, rerender } = renderHook(
      ({ text, limit }) => useTokenLimit(text, limit),
      { initialProps: { text: 'Hello', limit: 10 } }
    );

    const firstCount = result.current.count;

    // Rerenderizar com texto diferente
    rerender({ text: 'Hello, world!', limit: 10 });

    // Contagem deve ser diferente
    expect(result.current.count).not.toBe(firstCount);
  });

  it('recalcula quando o limite muda', () => {
    const { result, rerender } = renderHook(
      ({ text, limit }) => useTokenLimit(text, limit),
      { initialProps: { text: 'Hello', limit: 10 } }
    );

    const firstPercentage = result.current.percentage;

    // Rerenderizar com limite diferente
    rerender({ text: 'Hello', limit: 5 });

    // Porcentagem deve ser diferente
    expect(result.current.percentage).not.toBe(firstPercentage);
  });
});
