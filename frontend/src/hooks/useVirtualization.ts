// frontend/src/hooks/useVirtualization.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect, useRef, useCallback } from 'react';

export interface VirtualListConfig {
  itemHeight: number; // Altura estimada de cada item
  containerHeight: number; // Altura do container
  overscan?: number; // Número de itens extras para renderizar (buffer)
}

export interface VirtualListResult<T> {
  virtualItems: Array<{
    index: number;
    item: T;
    style: React.CSSProperties;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
}

/**
 * Hook para virtualização de listas longas
 * 
 * @example
 * ```tsx
 * const { virtualItems, totalHeight, scrollToIndex } = useVirtualList({
 *   items: messages,
 *   itemHeight: 100,
 *   containerHeight: 600,
 *   overscan: 3
 * });
 * 
 * return (
 *   <div style={{ height: containerHeight, overflow: 'auto' }} ref={containerRef}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       {virtualItems.map(({ index, item, style }) => (
 *         <div key={index} style={style}>
 *           <MessageComponent message={item} />
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
}: VirtualListConfig & { items: T[] }): VirtualListResult<T> {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Calcular índices visíveis
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Altura total da lista
  const totalHeight = items.length * itemHeight;

  // Handler de scroll otimizado com requestAnimationFrame
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    
    // Usar RAF para evitar layout thrashing
    requestAnimationFrame(() => {
      setScrollTop(target.scrollTop);
    });
  }, []);

  // Scroll para índice específico
  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current) return;
    
    const scrollTop = index * itemHeight;
    containerRef.current.scrollTop = scrollTop;
  }, [itemHeight]);

  // Adicionar listener de scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Gerar itens virtuais
  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      item: items[i],
      style: {
        position: 'absolute' as const,
        top: i * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
      },
    });
  }

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
  };
}

/**
 * Hook simplificado para listas com altura variável
 * Usa IntersectionObserver para detectar itens visíveis
 * 
 * @example
 * ```tsx
 * const { visibleItems, observerRef } = useVirtualListDynamic({
 *   items: messages,
 *   threshold: 0.1
 * });
 * ```
 */
export function useVirtualListDynamic<T>({
  items,
  threshold = 0.1,
}: {
  items: T[];
  threshold?: number;
}) {
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const itemRefs = useRef<Map<number, Element>>(new Map());

  useEffect(() => {
    // Criar IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisibleIndices((prevIndices) => {
          const newVisibleIndices = new Set(prevIndices);
          
          entries.forEach((entry) => {
            const index = Number(entry.target.getAttribute('data-index'));
            
            if (entry.isIntersecting) {
              newVisibleIndices.add(index);
            } else {
              newVisibleIndices.delete(index);
            }
          });
          
          return newVisibleIndices;
        });
      },
      { threshold }
    );

    // Observar todos os itens
    itemRefs.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items.length, threshold]);

  const registerItem = useCallback((index: number, element: Element | null) => {
    if (element) {
      itemRefs.current.set(index, element);
      observerRef.current?.observe(element);
    } else {
      const existing = itemRefs.current.get(index);
      if (existing) {
        observerRef.current?.unobserve(existing);
        itemRefs.current.delete(index);
      }
    }
  }, []);

  return {
    visibleIndices,
    registerItem,
  };
}

/**
 * Hook para scroll virtual otimizado com momentum
 * Ideal para listas muito longas (1000+ itens)
 */
export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Calcular range visível
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount);

  // Handler de scroll com RAF e throttling
  const handleScroll = useCallback((scrollTop: number) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(scrollTop);
      rafRef.current = null;
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    startIndex,
    endIndex,
    totalHeight: itemCount * itemHeight,
    offsetY: startIndex * itemHeight,
    handleScroll,
  };
}
