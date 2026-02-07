// frontend/src/hooks/memory/useLatestValue.ts
// Hook para prevenir closures que retêm memória

import { useRef, useEffect, useCallback } from 'react';

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
