// frontend/src/features/landing/components/LandingPage.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import useLandingPage from '../hooks/useLandingPage';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const { handleLogin } = useLandingPage();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.background.default,
        gap: 4,
      }}
    >
      <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 700 }}>
        MyIA
      </Typography>
      <Typography variant="h5" sx={{ color: 'text.secondary', mb: 2, textAlign: 'center', maxWidth: 480 }}>
        Hub de IA multi-provider com chat persistente, auditoria e analytics. Experimente o poder da IA de forma simples e segura.
      </Typography>
      <Button
        variant="contained"
        size="large"
        sx={{
          background: theme.palette.gradients.primary,
          color: 'white',
          px: 5,
          py: 1.5,
          fontWeight: 600,
          fontSize: 20,
          borderRadius: 2,
          boxShadow: 3,
          transition: 'all 0.2s',
          '&:hover': {
            background: theme.palette.gradients.secondary,
            transform: 'scale(1.05)',
          },
        }}
        onClick={handleLogin}
      >
        Entrar / Login
      </Button>
    </Box>
  );
};

export default LandingPage;
