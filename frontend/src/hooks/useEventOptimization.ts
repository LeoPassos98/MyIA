/**
 * Event Optimization Hooks
 * 
 * React hooks para otimização de performance através de
 * throttling e debouncing de valores e callbacks.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  throttle,
  debounce,
  rafThrottle,
  type CancellableFunction,
} from '../utils/performance';

/**
 * Hook para throttle de valores
 * 
 * Atualiza o valor throttled no máximo uma vez por intervalo.
 * Útil para valores que mudam frequentemente mas não precisam
 * atualizar a UI em tempo real.
 * 
 * @param value - Valor a ser throttled
 * @param limit - Tempo mínimo (ms) entre atualizações
 * @returns Valor throttled
 * 
 * @example
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 100);
 * 
 * useEffect(() => {
 *   const handleScroll = () => setScrollY(window.scrollY);
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, []);
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook para debounce de valores
 * 
 * Atualiza o valor debounced apenas após o valor parar de mudar
 * por um período. Ideal para inputs de busca.
 * 
 * @param value - Valor a ser debounced
 * @param delay - Tempo (ms) de espera após última mudança
 * @returns Valor debounced
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 * 
 * useEffect(() => {
 *   // Executa busca apenas quando usuário para de digitar
 *   performSearch(debouncedQuery);
 * }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para throttle de callbacks
 * 
 * Cria uma versão throttled de um callback que persiste entre renders.
 * A função retornada é estável (mesma referência) e inclui cleanup automático.
 * 
 * @param callback - Função a ser throttled
 * @param limit - Tempo mínimo (ms) entre execuções
 * @param deps - Dependências do callback
 * @returns Callback throttled com cleanup automático
 * 
 * @example
 * const handleScroll = useThrottledCallback((e: Event) => {
 *   console.log('Scroll position:', window.scrollY);
 * }, 100, []);
 * 
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, [handleScroll]);
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number,
  deps: React.DependencyList = []
): CancellableFunction<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, deps);
  const throttledRef = useRef<CancellableFunction<T> | null>(null);

  // Cria função throttled
  useMemo(() => {
    // Cancela throttle anterior se existir
    if (throttledRef.current) {
      throttledRef.current.cancel();
    }
    throttledRef.current = throttle(memoizedCallback, limit);
  }, [memoizedCallback, limit]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (throttledRef.current) {
        throttledRef.current.cancel();
      }
    };
  }, []);

  return throttledRef.current!;
}

/**
 * Hook para debounce de callbacks
 * 
 * Cria uma versão debounced de um callback que persiste entre renders.
 * A função retornada é estável (mesma referência) e inclui cleanup automático.
 * 
 * @param callback - Função a ser debounced
 * @param delay - Tempo (ms) de espera após última chamada
 * @param deps - Dependências do callback
 * @returns Callback debounced com cleanup automático
 * 
 * @example
 * const handleSearch = useDebouncedCallback((query: string) => {
 *   performSearch(query);
 * }, 300, []);
 * 
 * return (
 *   <input onChange={(e) => handleSearch(e.target.value)} />
 * );
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): CancellableFunction<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, deps);
  const debouncedRef = useRef<CancellableFunction<T> | null>(null);

  // Cria função debounced
  useMemo(() => {
    // Cancela debounce anterior se existir
    if (debouncedRef.current) {
      debouncedRef.current.cancel();
    }
    debouncedRef.current = debounce(memoizedCallback, delay);
  }, [memoizedCallback, delay]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (debouncedRef.current) {
        debouncedRef.current.cancel();
      }
    };
  }, []);

  return debouncedRef.current!;
}

/**
 * Hook para RAF throttle de callbacks
 * 
 * Cria uma versão throttled usando requestAnimationFrame.
 * Ideal para scroll handlers e animações que precisam sincronizar
 * com o refresh rate do navegador.
 * 
 * @param callback - Função a ser throttled
 * @param deps - Dependências do callback
 * @returns Callback RAF throttled com cleanup automático
 * 
 * @example
 * const handleScroll = useRafThrottledCallback((e: Event) => {
 *   // Atualiza posição de elementos de forma suave
 *   updateParallaxEffect();
 * }, []);
 * 
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll, { passive: true });
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, [handleScroll]);
 */
export function useRafThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): CancellableFunction<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, deps);
  const throttledRef = useRef<CancellableFunction<T> | null>(null);

  // Cria função RAF throttled
  useMemo(() => {
    // Cancela throttle anterior se existir
    if (throttledRef.current) {
      throttledRef.current.cancel();
    }
    throttledRef.current = rafThrottle(memoizedCallback);
  }, [memoizedCallback]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (throttledRef.current) {
        throttledRef.current.cancel();
      }
    };
  }, []);

  return throttledRef.current!;
}

/**
 * Hook combinado para throttle e debounce
 * 
 * Útil quando você precisa de ambos os comportamentos:
 * - Throttle para feedback imediato (leading edge)
 * - Debounce para processamento final (trailing edge)
 * 
 * @param callback - Função a ser otimizada
 * @param throttleLimit - Tempo mínimo entre execuções throttled
 * @param debounceDelay - Tempo de espera para execução final
 * @param deps - Dependências do callback
 * @returns Objeto com callbacks throttled e debounced
 * 
 * @example
 * const { throttled, debounced } = useThrottleDebounce(
 *   (value: string) => console.log(value),
 *   150,
 *   500,
 *   []
 * );
 * 
 * // Throttled para feedback visual imediato
 * // Debounced para salvar no servidor
 * <input onChange={(e) => {
 *   throttled(e.target.value); // UI update
 *   debounced(e.target.value); // API call
 * }} />
 */
export function useThrottleDebounce<T extends (...args: any[]) => any>(
  callback: T,
  throttleLimit: number,
  debounceDelay: number,
  deps: React.DependencyList = []
) {
  const throttled = useThrottledCallback(callback, throttleLimit, deps);
  const debounced = useDebouncedCallback(callback, debounceDelay, deps);

  return { throttled, debounced };
}
