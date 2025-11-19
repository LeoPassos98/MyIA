import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Drawer, useTheme, Tooltip } from '@mui/material';
import { Menu as MenuIcon, Tune as TuneIcon } from '@mui/icons-material';
import { useLayout } from '../../contexts/LayoutContext'; // Verifique se o caminho volta 2 pastas
import { Outlet } from 'react-router-dom'; // Adicionado o import do Outlet
import ControlPanel from '../drawer/ControlPanel.tsx'; // Verifique o caminho correto
import HistorySidebar from '../../features/chat/components/drawer/HistorySidebar'; // Importado o novo componente

export default function MainLayout({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  const { 
    isHistoryOpen, setIsHistoryOpen, 
    isEditorOpen, setIsEditorOpen 
  } = useLayout();

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: 1,
          borderColor: 'divider',
          boxShadow: 'none' 
        }}
      >
        <Toolbar variant="dense">
          {/* BOTÃO ESQUERDO: Histórico */}
          <IconButton
            color="inherit"
            aria-label="open history"
            edge="start"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            MyIA V47
          </Typography>

          {/* BOTÃO DIREITO: Painel de Controle (Onde está o ChatConfig) */}
          <Tooltip title="Painel de Controle e Ajustes">
            <IconButton
              color={isEditorOpen ? "primary" : "inherit"}
              onClick={() => setIsEditorOpen(!isEditorOpen)}
            >
              <TuneIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Gaveta Esquerda: Histórico */}
      <Drawer
        anchor="left"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      >
        <HistorySidebar />
      </Drawer>

      {/* Gaveta Direita: Painel de Controle */}
      <Drawer
        anchor="right"
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 2, // Acima de tudo
          '& .MuiDrawer-paper': { width: 360, boxSizing: 'border-box', mt: '48px', height: 'calc(100% - 48px)' },
        }}
      >
        <ControlPanel />
      </Drawer>

      {/* Área Principal de Conteúdo */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100%',
          pt: '48px', // Altura do Toolbar dense
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: theme.palette.background.default
        }}
      >
        {/* Se não houver children, renderiza o Outlet */}
        {children || <Outlet />}
      </Box>
    </Box>
  );
}