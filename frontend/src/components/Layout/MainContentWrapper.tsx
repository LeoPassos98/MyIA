import { Box } from '@mui/material';
import { ReactNode } from 'react';

export default function MainContentWrapper({ children }: { children: ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        height: '100%',
        pt: '56px', // Compensação do Header
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(102,126,234,0.02) 0%, rgba(118,75,162,0.02) 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: 'radial-gradient(ellipse at center top, rgba(102,126,234,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      {children}
    </Box>
  );
}
