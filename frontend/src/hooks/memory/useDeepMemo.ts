// frontend/src/hooks/memory/useDeepMemo.ts
// Hook para memoização profunda de objetos

import { useRef, useMemo } from 'react';

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
