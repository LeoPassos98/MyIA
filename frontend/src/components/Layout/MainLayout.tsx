import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import MainHeader from './MainHeader';
import AppDrawers from './AppDrawers';
import MainContentWrapper from './MainContentWrapper';

export default function MainLayout({ children }: { children?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#fafafa' }}>
      
      {/* 1. Barra Superior */}
      <MainHeader />

      {/* 2. Gavetas Laterais (Popups) */}
      <AppDrawers />

      {/* 3. Conteúdo Principal (Chat/Páginas) */}
      <MainContentWrapper>
        {children || <Outlet />}
      </MainContentWrapper>
      
    </Box>
  );
}