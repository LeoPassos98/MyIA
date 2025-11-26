import { Drawer, useTheme, alpha } from '@mui/material';
import { useLayout } from '../../contexts/LayoutContext';
import ControlPanel from '../../features/chat/components/ControlPanel';
import HistorySidebar from '../../features/chat/components/drawer/HistorySidebar';

export default function AppDrawers() {
  const theme = useTheme();
  const { isHistoryOpen, setIsHistoryOpen, isEditorOpen, setIsEditorOpen } = useLayout();

  // Estilo base para os painéis laterais (Glassmorphism adaptativo)
  const drawerPaperStyle = {
    boxSizing: 'border-box' as const,
    mt: '56px', // Altura do Header
    height: 'calc(100% - 56px)',
    // AQUI ESTÁ A MÁGICA: Usa a cor do papel do tema, não branco fixo
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.background.paper, 0.95)
      : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid',
    borderColor: 'divider',
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
            borderRight: '1px solid',
            borderColor: 'divider',
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
            borderLeft: '1px solid',
            borderColor: 'divider',
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <ControlPanel />
      </Drawer>
    </>
  );
}