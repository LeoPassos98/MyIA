// frontend/src/hooks/memory/useBoundedArray.ts
// Hook para limitar tamanho de arrays em estado

import { useCallback } from 'react';

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
