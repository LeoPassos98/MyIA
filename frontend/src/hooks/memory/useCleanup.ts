// frontend/src/hooks/memory/useCleanup.ts
// Hook para garantir cleanup de recursos

import { useRef, useEffect, useCallback } from 'react';

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
