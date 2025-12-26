// frontend/src/components/Layout/MainHeader.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { AppBar, Toolbar, Box, Fade } from '@mui/material';
import { Menu as MenuIcon, Tune as TuneIcon, History as HistoryIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { useLayout } from '../../contexts/LayoutContext';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import Logo from '../Logo';
import LayoutToggleButton from './LayoutToggleButton';
import { HEADER_HEIGHT } from './layoutConstants';
import { useHeaderSlots } from '../../contexts/HeaderSlotsContext';

export default function MainHeader() {
  const theme = useTheme();
  const location = useLocation();
  
  const { 
    isHistoryOpen, 
    setIsHistoryOpen, 
    isEditorOpen, 
    setIsEditorOpen 
  } = useLayout();

  const isChatPage = location.pathname === '/' || location.pathname.startsWith('/chat');
  const { slots } = useHeaderSlots();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        
        // --- VISUAL SÓLIDO (PERFORMANCE MÁXIMA) ---
        bgcolor: 'background.paper', // Usa a cor sólida do tema (Branco ou Cinza Escuro)
        backdropFilter: 'none',      // Desativa explicitamente o blur
        
        // Borda sutil para separar do conteúdo
        borderBottom: '1px solid',
        borderColor: 'divider',
        
        // Sombra suave apenas no modo claro para dar profundidade
        boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <Toolbar 
        variant="dense" 
        sx={{ 
          py: 1, 
          minHeight: HEADER_HEIGHT,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        
        {/* LADO ESQUERDO */}
        <Box sx={{ width: 40, display: 'flex', justifyContent: 'flex-start' }}>
          {isChatPage ? (
            <Fade in={isChatPage}>
              <Box> 
                <LayoutToggleButton
                  isActive={isHistoryOpen}
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  icon={<MenuIcon />}
                  activeIcon={<HistoryIcon />}
                  title="Histórico"
                  gradient={theme.palette.gradients.primary}
                />
              </Box>
            </Fade>
          ) : (
            slots.left ? <Box sx={{ display: 'flex' }}>{slots.left}</Box> : null
          )}
        </Box>

        {/* CENTRO */}
        {slots.center ? slots.center : <Logo brandText={slots.brandText} />}

        {/* LADO DIREITO */}
        <Box sx={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>
          {isChatPage ? (
            <Fade in={isChatPage}>
              <Box>
                <LayoutToggleButton
                  isActive={isEditorOpen}
                  onClick={() => setIsEditorOpen(!isEditorOpen)}
                  icon={<TuneIcon />}
                  activeIcon={<DashboardIcon />}
                  title="Painel"
                  gradient={theme.palette.gradients.secondary}
                />
              </Box>
            </Fade>
          ) : (
            slots.right ? <Box sx={{ display: 'flex' }}>{slots.right}</Box> : null
          )}
        </Box>

      </Toolbar>
    </AppBar>
  );
}