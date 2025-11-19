import { 
  AppBar, Toolbar, IconButton, Typography, Box, Drawer, 
  CssBaseline, useTheme 
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Outlet } from 'react-router-dom'; 
import { useLayout } from '../../contexts/LayoutContext';
import ControlPanel from '../drawer/ControlPanel';

export default function MainLayout() {
  const { 
    isEditorOpen, setIsEditorOpen
  } = useLayout();

  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <CssBaseline />
      
      {/* APPBAR */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml: 2 }}>
            MyIA
          </Typography>
          <IconButton color="inherit" onClick={() => setIsEditorOpen(!isEditorOpen)}>
            <TuneIcon />
          </IconButton>
          <IconButton color="inherit">
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* GAVETA DIREITA (EDITOR) */}
      <Drawer
        anchor="right"
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        variant="persistent"
        sx={{ 
          width: 400,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 400,
            boxSizing: 'border-box',
          },
        }}
      >
        {/* Espaçamento para não sobrepor a AppBar */}
        <Toolbar />
        
        {/* Painel de Controle V47 */}
        <Box sx={{ 
          width: 400, 
          height: '100%',
          overflow: 'auto'
        }}>
          <ControlPanel />
        </Box>
      </Drawer>

      {/* ÁREA PRINCIPAL */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          mt: '64px', 
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginRight: isEditorOpen ? '400px' : 0,
        }}
      >
        <Outlet /> 
      </Box>
    </Box>
  );
}