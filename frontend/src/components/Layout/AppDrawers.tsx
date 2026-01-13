// frontend/src/components/Layout/AppDrawers.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Drawer, useTheme, alpha } from '@mui/material';
import { HEADER_HEIGHT } from '../../components/Layout/layoutConstants';
import { useLayout } from '../../contexts/LayoutContext';
import ControlPanel from '../../features/chat/components/ControlPanel';
import HistorySidebar from '../../features/chat/components/drawer/HistorySidebar';

export default function AppDrawers() {
  const theme = useTheme();
  const { isHistoryOpen, setIsHistoryOpen, isEditorOpen, setIsEditorOpen } = useLayout();

  // Estilo base para os painéis laterais (Glassmorphism adaptativo, 100% theme)
  const drawerPaperStyle = {
    boxSizing: 'border-box' as const,
    mt: `${HEADER_HEIGHT}px`, // Altura do Header
    height: `calc(100% - ${HEADER_HEIGHT}px)`,
    background: alpha(theme.palette.background.paper, 0.95),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.divider}`,
    borderColor: theme.palette.divider,
    boxShadow: theme.shadows[4],
  };

  return (
    <>
      {/* Gaveta Esquerda - Histórico */}
      <Drawer
        anchor="left"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            ...drawerPaperStyle,
            width: 300,
            borderRight: `1px solid ${theme.palette.divider}`,
            borderColor: theme.palette.divider,
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <HistorySidebar />
      </Drawer>

      {/* Gaveta Direita - Painel de Controle */}
      <Drawer
        anchor="right"
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 2,
          '& .MuiDrawer-paper': {
            ...drawerPaperStyle,
            width: 380,
            borderLeft: `1px solid ${theme.palette.divider}`,
            borderColor: theme.palette.divider,
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <ControlPanel />
      </Drawer>
    </>
  );
}