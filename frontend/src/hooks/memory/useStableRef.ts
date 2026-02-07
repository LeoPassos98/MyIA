// frontend/src/hooks/memory/useStableRef.ts
// Hook para criar referência estável de valor

import { useRef, useEffect } from 'react';

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
