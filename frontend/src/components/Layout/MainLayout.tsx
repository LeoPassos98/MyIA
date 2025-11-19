import { 
  AppBar, Toolbar, IconButton, Typography, Box, Drawer, 
  Tabs, Tab, CssBaseline, useTheme, useMediaQuery 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TuneIcon from '@mui/icons-material/Tune';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Outlet } from 'react-router-dom'; 
import { useLayout } from '../../contexts/LayoutContext';
import ChatSidebar from '../Chat/ChatSidebar'; 

export default function MainLayout() {
  const { 
    isHistoryOpen, setIsHistoryOpen, 
    isEditorOpen, setIsEditorOpen,
    currentEditorTab, setCurrentEditorTab
  } = useLayout();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <CssBaseline />
      
      {/* APPBAR */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => setIsHistoryOpen(!isHistoryOpen)} edge="start">
            <MenuIcon />
          </IconButton>
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

      {/* GAVETA ESQUERDA (HISTÓRICO) */}
      <Drawer
        anchor="left"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        variant={isMobile ? "temporary" : "persistent"}
        sx={{
          width: 280, flexShrink: 0,
          '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box', mt: '64px' },
        }}
      >
        <ChatSidebar onClose={() => isMobile && setIsHistoryOpen(false)} />
      </Drawer>

      {/* GAVETA DIREITA (EDITOR) */}
      <Drawer
        anchor="right"
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        variant="persistent"
        sx={{
          width: 400, flexShrink: 0,
          '& .MuiDrawer-paper': { width: 400, boxSizing: 'border-box', mt: '64px' },
        }}
      >
        <Tabs 
          value={currentEditorTab} 
          onChange={(_, newTab) => setCurrentEditorTab(newTab)}
          variant="fullWidth"
        >
          <Tab label="Ajustes Padrão" />
          <Tab label="Editor Manual" />
        </Tabs>
        
        <Box sx={{ p: 2 }}>
          {currentEditorTab === 0 ? (
            <Typography>Controles de IA virão aqui (Fase 3)</Typography>
          ) : (
            <Typography>Editor Manual virá aqui (Fase 3)</Typography>
          )}
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
          marginLeft: isHistoryOpen && !isMobile ? '280px' : 0,
          marginRight: isEditorOpen ? '400px' : 0,
        }}
      >
        <Outlet /> 
      </Box>
    </Box>
  );
}