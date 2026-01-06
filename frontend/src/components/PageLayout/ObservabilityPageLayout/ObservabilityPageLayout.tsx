// frontend/src/components/PageLayout/ObservabilityPageLayout/ObservabilityPageLayout.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import { HEADER_HEIGHT } from '@/components/Layout/layoutConstants';
import type { ObservabilityPageLayoutProps } from './types';
import { ObservabilitySidebar } from './ObservabilitySidebar';
import { ObservabilityDrawer } from './ObservabilityDrawer';
import { useScrollSpy } from './useScrollSpy';
import { scrollbarStyles } from '@/theme/scrollbarStyles';

/**
 * Layout reutilizável para páginas densas de observabilidade
 *
 * - Sem sub-header próprio (usa slots do MainHeader)
 * - Sidebar fixa no desktop
 * - Drawer controlado externamente no mobile
 */
export function ObservabilityPageLayout({
  sections,
  children,
  defaultSectionId,
  topOffset = HEADER_HEIGHT,
  drawerOpen,
  onCloseDrawer,
}: ObservabilityPageLayoutProps) {
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const { activeSectionId, scrollToSection } = useScrollSpy({
    sectionIds,
    offset: topOffset,
  });

  const currentSectionId =
    activeSectionId ?? defaultSectionId ?? sectionIds[0] ?? null;

  const handleSectionClick = useCallback(
    (sectionId: string) => {
      scrollToSection(sectionId);
      onCloseDrawer();
    },
    [scrollToSection, onCloseDrawer]
  );

  return (
    <Box 
      sx={{ 
        height: '100%',
        overflow: 'auto', // Scroll do conteúdo da página
        ...scrollbarStyles, // Estilos unificados de scrollbar
      }}
    >
      {/* Container principal */}
      <Box
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: 3,
        }}
      >
        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Sidebar (desktop) */}
          <ObservabilitySidebar
            sections={sections}
            activeSectionId={currentSectionId}
            onSectionClick={handleSectionClick}
          />

          {/* Conteúdo principal */}
          <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
            {children}
          </Box>
        </Box>
      </Box>

      {/* Drawer (mobile) */}
      <ObservabilityDrawer
        sections={sections}
        activeSectionId={currentSectionId}
        onSectionClick={handleSectionClick}
        open={drawerOpen}
        onClose={onCloseDrawer}
      />
    </Box>
  );
}
