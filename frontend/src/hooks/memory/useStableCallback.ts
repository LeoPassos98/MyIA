// frontend/src/hooks/memory/useStableCallback.ts
// Hook para criar callbacks estáveis que não causam re-renders

import { useRef, useEffect, useCallback } from 'react';

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
