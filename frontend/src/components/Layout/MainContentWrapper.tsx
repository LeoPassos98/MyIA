// frontend/src/components/Layout/MainContentWrapper.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { HEADER_HEIGHT } from './layoutConstants';

interface MainContentWrapperProps {
  children: ReactNode;
}

export default function MainContentWrapper({ children }: MainContentWrapperProps) {
  useLayout(); 

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        overflow: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        pt: `${HEADER_HEIGHT}px`,
        
        transition: (theme) => theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      {children}
    </Box>
  );
}