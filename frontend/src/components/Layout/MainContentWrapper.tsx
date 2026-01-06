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
        minHeight: 0, // Importante para flex funcionar corretamente
        overflow: 'hidden', // O scroll fica no conteúdo interno (ex: MessageList)
        display: 'flex',
        flexDirection: 'column',
        // Offset para compensar o header fixo (position: fixed)
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