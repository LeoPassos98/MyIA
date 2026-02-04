// frontend/src/components/PageLayout/ObservabilityPageLayout/useScrollSpy.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect, useCallback } from 'react';
import { HEADER_HEIGHT } from '@/components/Layout/layoutConstants';

interface UseScrollSpyOptions {
  /** IDs das seções a observar */
  sectionIds: string[];
  /** Offset do topo (para headers fixos) */
  offset?: number;
}

interface UseScrollSpyReturn {
  /** ID da seção atualmente ativa */
  activeSectionId: string | null;
  /** Função para scroll até uma seção */
  scrollToSection: (sectionId: string) => void;
}

/**
 * Hook para detectar qual seção está visível na viewport
 */
export function useScrollSpy({
  sectionIds,
  offset = HEADER_HEIGHT,
}: UseScrollSpyOptions): UseScrollSpyReturn {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sectionIds[0] ?? null
  );

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        setActiveSectionId(visibleEntry.target.id);
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: `-${offset}px 0px -70% 0px`,
      threshold: 0,
    });

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionIds, offset]);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    // Funciona tanto com window scroll quanto com container interno (overflow: auto).
    // O offset deve ser controlado pelo scrollMarginTop da section.
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  return {
    activeSectionId,
    scrollToSection,
  };
}
