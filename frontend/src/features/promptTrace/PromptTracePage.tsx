// frontend/src/features/promptTrace/PromptTracePage.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TimelineIcon from '@mui/icons-material/Timeline';
import DataObjectIcon from '@mui/icons-material/DataObject';

import {
  ObservabilityPageLayout,
  ObservabilitySection,
} from '@/components/PageLayout/ObservabilityPageLayout';
import type { ObservabilitySectionItem } from '@/components/PageLayout/ObservabilityPageLayout';
import { useHeaderSlots } from '@/contexts/HeaderSlotsContext';

import { usePromptTraceLoader } from './hooks/usePromptTraceLoader';
import { PromptTraceViewer } from './components/PromptTraceViewer';
import { RawPromptTraceModal } from './components/RawPromptTraceModal';

const PROMPT_TRACE_SECTIONS: ObservabilitySectionItem[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: <TimelineIcon fontSize="small" />,
  },
];

/**
 * Página de visualização de Prompt Trace
 */
export default function PromptTracePage() {
  const { traceId } = useParams<{ traceId: string }>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rawModalOpen, setRawModalOpen] = useState(false);
  const { setSlots, resetSlots } = useHeaderSlots();

  const handleOpenDrawer = useCallback(() => setDrawerOpen(true), []);
  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);

  const { trace, loading, error } = usePromptTraceLoader(traceId);

  // Configurar slots do header
  useEffect(() => {
    setSlots({
      brandText: 'PromptTrace',
      left: (
        <IconButton
          onClick={handleOpenDrawer}
          aria-label="Abrir menu de navegação"
          sx={{ display: { xs: 'flex', lg: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
      ),
      right: trace ? (
        <Button
          size="small"
          startIcon={<DataObjectIcon />}
          onClick={() => setRawModalOpen(true)}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          Raw JSON
        </Button>
      ) : undefined,
    });

    return () => resetSlots();
  }, [setSlots, resetSlots, handleOpenDrawer, trace]);

  return (
    <>
      <ObservabilityPageLayout
        sections={PROMPT_TRACE_SECTIONS}
        defaultSectionId="overview"
        drawerOpen={drawerOpen}
        onOpenDrawer={handleOpenDrawer}
        onCloseDrawer={handleCloseDrawer}
      >
        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Conteúdo */}
        {!loading && !error && trace && (
          <>
            {/* Visão Geral */}
            <ObservabilitySection id="overview" title="Visão Geral">
              <PromptTraceViewer trace={trace} />
            </ObservabilitySection>            
          </>
        )}

        {/* Sem trace */}
        {!loading && !error && !trace && (
          <Alert severity="info">
            Nenhum trace encontrado para o ID: {traceId}
          </Alert>
        )}
      </ObservabilityPageLayout>

      {/* Modal Raw JSON */}
      {trace && (
        <RawPromptTraceModal
          open={rawModalOpen}
          trace={trace}
          onClose={() => setRawModalOpen(false)}
        />
      )}
    </>
  );
}
