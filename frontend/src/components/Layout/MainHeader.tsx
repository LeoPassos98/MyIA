import { AppBar, Toolbar, Box } from '@mui/material';
import { Menu as MenuIcon, Tune as TuneIcon, History as HistoryIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { useLayout } from '../../contexts/LayoutContext';
import Logo from '../Logo';
import LayoutToggleButton from './LayoutToggleButton';

export default function MainHeader() {
  const { isHistoryOpen, setIsHistoryOpen, isEditorOpen, setIsEditorOpen } = useLayout();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid',
        borderColor: 'rgba(0,0,0,0.08)',
      }}
    >
      <Toolbar variant="dense" sx={{ py: 1, minHeight: 56 }}>
        {/* Botão Esquerdo - Histórico */}
        <LayoutToggleButton
          isActive={isHistoryOpen}
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          icon={<MenuIcon />}
          activeIcon={<HistoryIcon />}
          title="Histórico de Conversas"
          color="#667eea"
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />

        <Box sx={{ width: 1, height: 24, mx: 1 }} />

        {/* Logo Central */}
        <Logo />

        <Box sx={{ width: 1, height: 24, mx: 1 }} />

        {/* Botão Direito - Painel */}
        <LayoutToggleButton
          isActive={isEditorOpen}
          onClick={() => setIsEditorOpen(!isEditorOpen)}
          icon={<TuneIcon />}
          activeIcon={<DashboardIcon />}
          title="Painel de Controle"
          color="#764ba2"
          gradient="linear-gradient(135deg, #764ba2 0%, #667eea 100%)"
        />
      </Toolbar>
    </AppBar>
  );
}
