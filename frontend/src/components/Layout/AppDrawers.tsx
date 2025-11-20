import { Drawer } from '@mui/material';
import { useLayout } from '../../contexts/LayoutContext';
import ControlPanel from '../drawer/ControlPanel';
import HistorySidebar from '../../features/chat/components/drawer/HistorySidebar';

export default function AppDrawers() {
  const { isHistoryOpen, setIsHistoryOpen, isEditorOpen, setIsEditorOpen } = useLayout();

  return (
    <>
      {/* Gaveta Esquerda - Histórico */}
      <Drawer
        anchor="left"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            boxSizing: 'border-box',
            mt: '56px',
            height: 'calc(100% - 56px)',
            borderRight: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
            boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
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
            width: 380,
            boxSizing: 'border-box',
            mt: '56px',
            height: 'calc(100% - 56px)',
            borderLeft: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
          },
        }}
      >
        <ControlPanel />
      </Drawer>
    </>
  );
}
