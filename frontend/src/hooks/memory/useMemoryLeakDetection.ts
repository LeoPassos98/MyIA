// frontend/src/hooks/memory/useMemoryLeakDetection.ts
// Hook para detectar e prevenir memory leaks

import { useRef, useEffect, useCallback } from 'react';

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
