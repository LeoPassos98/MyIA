// frontend/src/components/Layout/MainHeader/index.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { AppBar, Toolbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { useLayout } from '../../../contexts/LayoutContext';
import { useHeaderSlots } from '../../../contexts/HeaderSlotsContext';
import { HEADER_HEIGHT } from '../layoutConstants';
import HeaderLeft from './HeaderLeft';
import HeaderCenter from './HeaderCenter';
import HeaderRight from './HeaderRight';

export default function MainHeader() {
  const theme = useTheme();
  const location = useLocation();
  const { isHistoryOpen, setIsHistoryOpen, isEditorOpen, setIsEditorOpen } = useLayout();
  // Funções que garantem exclusividade de abertura
  const handleHistoryOpen = (open: boolean) => {
    setIsHistoryOpen(open);
    if (open) setIsEditorOpen(false);
  };
  const handleEditorOpen = (open: boolean) => {
    setIsEditorOpen(open);
    if (open) setIsHistoryOpen(false);
  };
  const isChatPage = location.pathname === '/' || location.pathname.startsWith('/chat');
  const { slots } = useHeaderSlots();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: theme.palette.mode === 'dark' ? 'none' : 1,
        transition: 'all 0.2s',
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          py: 1,
          minHeight: HEADER_HEIGHT,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <HeaderLeft
          isChatPage={isChatPage}
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={handleHistoryOpen}
          isEditorOpen={isEditorOpen}
          slots={slots}
          theme={theme}
        />
        <HeaderCenter slots={slots} />
        <HeaderRight
          isChatPage={isChatPage}
          isEditorOpen={isEditorOpen}
          setIsEditorOpen={handleEditorOpen}
          isHistoryOpen={isHistoryOpen}
          slots={slots}
          theme={theme}
        />
      </Toolbar>
    </AppBar>
  );
}
