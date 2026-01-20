// frontend/src/hooks/useMemoryOptimization.ts
// Fase 3: Memory Optimization - Memory Management Hooks
// Hooks para gerenciamento de memória e prevenção de memory leaks

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { ObjectPool } from '../utils/objectPool';

/**
 * Hook para usar Object Pool em componentes React
 * Gerencia lifecycle do pool automaticamente
 * 
 * @template T Tipo do objeto poolado
 * @param factory Função que cria novos objetos
 * @param reset Função que reseta objetos
 * @param maxSize Tamanho máximo do pool
 * @returns Funções acquire e release do pool
 * 
 * @example
 * const { acquire, release } = useObjectPool(
 *   () => ({ data: '' }),
 *   (obj) => { obj.data = ''; },
 *   50
 * );
 */
export function useObjectPool<T>(
  factory: () => T,
  reset: (obj: T) => void,
  maxSize: number = 100
) {
  const poolRef = useRef<ObjectPool<T>>();

  // Cria pool apenas uma vez
  if (!poolRef.current) {
    poolRef.current = new ObjectPool(factory, reset, maxSize);
  }

  // Limpa pool ao desmontar
  useEffect(() => {
    return () => {
      poolRef.current?.clear();
    };
  }, []);

  // Retorna métodos estáveis
  const acquire = useCallback(() => {
    return poolRef.current!.acquire();
  }, []);

  const release = useCallback((obj: T) => {
    poolRef.current!.release(obj);
  }, []);

  const getStats = useCallback(() => {
    return poolRef.current!.getStats();
  }, []);

  return { acquire, release, getStats };
}

/**
 * Hook para criar callbacks estáveis que não causam re-renders
 * Similar ao useCallback mas com melhor performance
 * 
 * @param callback Função a ser estabilizada
 * @returns Callback estável que sempre aponta para versão mais recente
 * 
 * @example
 * const handleClick = useStableCallback((id: string) => {
 *   // Sempre usa valores mais recentes sem deps
 *   console.log(currentState, id);
 * });
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  // Atualiza ref sempre que callback muda
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Retorna função estável que delega para ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args: any[]) => {
    return callbackRef.current(...args);
  }) as T, []);
}

/**
 * Hook para criar referência estável de valor
 * Útil para evitar re-renders causados por mudanças de referência
 * 
 * @param value Valor a ser estabilizado
 * @returns Referência estável do valor
 * 
 * @example
 * const stableConfig = useStableRef(config);
 * // stableConfig.current sempre tem valor mais recente
 */
export function useStableRef<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
}

/**
 * Hook para garantir cleanup de recursos
 * Rastreia recursos ativos e garante limpeza ao desmontar
 * 
 * @returns Funções para registrar e limpar recursos
 * 
 * @example
 * const { register, cleanup } = useCleanup();
 * 
 * useEffect(() => {
 *   const timer = setTimeout(...);
 *   register('timer', () => clearTimeout(timer));
 *   
 *   const listener = () => {...};
 *   window.addEventListener('resize', listener);
 *   register('resize', () => window.removeEventListener('resize', listener));
 * }, []);
 */
export function useCleanup() {
  const cleanupFnsRef = useRef<Map<string, () => void>>(new Map());

  const register = useCallback((key: string, cleanupFn: () => void) => {
    // Remove cleanup anterior se existir
    const existing = cleanupFnsRef.current.get(key);
    if (existing) {
      existing();
    }
    cleanupFnsRef.current.set(key, cleanupFn);
  }, []);

  const cleanup = useCallback((key: string) => {
    const cleanupFn = cleanupFnsRef.current.get(key);
    if (cleanupFn) {
      cleanupFn();
      cleanupFnsRef.current.delete(key);
    }
  }, []);

  const cleanupAll = useCallback(() => {
    cleanupFnsRef.current.forEach(fn => fn());
    cleanupFnsRef.current.clear();
  }, []);

  // Cleanup automático ao desmontar
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  return { register, cleanup, cleanupAll };
}

/**
 * Hook para detectar e prevenir memory leaks
 * Monitora refs, timers e listeners não limpos
 * 
 * @param componentName Nome do componente (para debug)
 * @returns Objeto com métodos de tracking
 * 
 * @example
 * const memoryTracker = useMemoryLeakDetection('MyComponent');
 * 
 * useEffect(() => {
 *   const timer = setTimeout(...);
 *   memoryTracker.trackTimer(timer);
 *   return () => memoryTracker.clearTimer(timer);
 * }, []);
 */
export function useMemoryLeakDetection(componentName: string) {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const listenersRef = useRef<Set<{ target: any; event: string; handler: any }>>(new Set());
  const observersRef = useRef<Set<ResizeObserver | IntersectionObserver | MutationObserver>>(new Set());
  const isMountedRef = useRef(true);

  // Marca componente como montado
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const trackTimer = useCallback((timer: NodeJS.Timeout) => {
    timersRef.current.add(timer);
  }, []);

  const clearTimer = useCallback((timer: NodeJS.Timeout) => {
    clearTimeout(timer);
    timersRef.current.delete(timer);
  }, []);

  const trackListener = useCallback((target: any, event: string, handler: any) => {
    listenersRef.current.add({ target, event, handler });
  }, []);

  const removeListener = useCallback((target: any, event: string, handler: any) => {
    target.removeEventListener(event, handler);
    listenersRef.current.forEach(item => {
      if (item.target === target && item.event === event && item.handler === handler) {
        listenersRef.current.delete(item);
      }
    });
  }, []);

  const trackObserver = useCallback((observer: ResizeObserver | IntersectionObserver | MutationObserver) => {
    observersRef.current.add(observer);
  }, []);

  const disconnectObserver = useCallback((observer: ResizeObserver | IntersectionObserver | MutationObserver) => {
    observer.disconnect();
    observersRef.current.delete(observer);
  }, []);

  // Cleanup automático ao desmontar
  useEffect(() => {
    // Captura refs no momento da criação do effect
    const timers = timersRef.current;
    const listeners = listenersRef.current;
    const observers = observersRef.current;

    return () => {
      // Limpa todos os timers
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();

      // Remove todos os listeners
      listeners.forEach(({ target, event, handler }) => {
        try {
          target.removeEventListener(event, handler);
        } catch (e) {
          console.warn(`[${componentName}] Erro ao remover listener:`, e);
        }
      });
      listeners.clear();

      // Desconecta todos os observers
      observers.forEach(observer => {
        try {
          observer.disconnect();
        } catch (e) {
          console.warn(`[${componentName}] Erro ao desconectar observer:`, e);
        }
      });
      observers.clear();

      // Log em dev mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${componentName}] Memory cleanup completed`);
      }
    };
  }, [componentName]);

  return {
    trackTimer,
    clearTimer,
    trackListener,
    removeListener,
    trackObserver,
    disconnectObserver,
    isMounted: () => isMountedRef.current,
  };
}

/**
 * Hook para memoização profunda de objetos
 * Evita re-renders causados por objetos com mesmos valores mas referências diferentes
 * 
 * @param value Valor a ser memoizado
 * @returns Valor memoizado (só muda se conteúdo mudar)
 * 
 * @example
 * const config = useDeepMemo({ provider: 'aws', model: 'claude' });
 * // config só muda se valores internos mudarem
 */
export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  const prevValueRef = useRef<string>();

  return useMemo(() => {
    const currentValue = JSON.stringify(value);
    
    // Compara serialização para detectar mudanças profundas
    if (currentValue !== prevValueRef.current) {
      prevValueRef.current = currentValue;
      ref.current = value;
    }
    
    return ref.current;
  }, [value]);
}

/**
 * Hook para prevenir closures que retêm memória
 * Útil em event handlers que capturam estado antigo
 * 
 * @param deps Dependências a serem rastreadas
 * @returns Getter para valores atuais
 * 
 * @example
 * const getLatest = useLatestValue({ count, items });
 * 
 * const handleClick = useCallback(() => {
 *   const { count, items } = getLatest();
 *   // Sempre usa valores mais recentes
 * }, []); // Deps vazias, mas acessa valores atuais
 */
export function useLatestValue<T extends Record<string, any>>(deps: T) {
  const ref = useRef(deps);

  useEffect(() => {
    ref.current = deps;
  });

  return useCallback(() => ref.current, []);
}

/**
 * Hook para limitar tamanho de arrays em estado
 * Previne crescimento ilimitado de listas
 * 
 * @param maxSize Tamanho máximo do array
 * @returns Função para adicionar items com limite
 * 
 * @example
 * const [logs, setLogs] = useState<string[]>([]);
 * const addLog = useBoundedArray(logs, setLogs, 100);
 * 
 * addLog('novo log'); // Mantém apenas últimos 100
 */
export function useBoundedArray<T>(
  _array: T[],
  setArray: React.Dispatch<React.SetStateAction<T[]>>,
  maxSize: number
) {
  return useCallback((item: T) => {
    setArray((prev: T[]) => {
      const newArray = [...prev, item];
      // Remove items antigos se exceder limite
      if (newArray.length > maxSize) {
        return newArray.slice(-maxSize);
      }
      return newArray;
    });
  }, [setArray, maxSize]);
}

/**
 * Hook para monitorar uso de memória do componente (dev only)
 * Útil para identificar memory leaks durante desenvolvimento
 * 
 * @param componentName Nome do componente
 * @param enabled Se deve monitorar (padrão: apenas em dev)
 */
export function useMemoryMonitor(
  componentName: string,
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current++;

    if (!enabled) return;

    // Log a cada 10 renders
    if (renderCountRef.current % 10 === 0) {
      const uptime = Date.now() - mountTimeRef.current;
      console.log(`[Memory Monitor] ${componentName}:`, {
        renders: renderCountRef.current,
        uptime: `${(uptime / 1000).toFixed(1)}s`,
        avgRenderRate: `${(renderCountRef.current / (uptime / 1000)).toFixed(2)}/s`,
      });
    }
  });

  useEffect(() => {
    if (!enabled) return;

    const mountTime = mountTimeRef.current;
    const renderCount = renderCountRef.current;

    return () => {
      const uptime = Date.now() - mountTime;
      console.log(`[Memory Monitor] ${componentName} unmounted:`, {
        totalRenders: renderCount,
        lifetime: `${(uptime / 1000).toFixed(1)}s`,
      });
    };
  }, [componentName, enabled]);
}
