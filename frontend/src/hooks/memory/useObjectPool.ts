// frontend/src/hooks/memory/useObjectPool.ts
// Hook para usar Object Pool em componentes React

import { useRef, useEffect, useCallback } from 'react';
import { ObjectPool } from '../../utils/objectPool';

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
