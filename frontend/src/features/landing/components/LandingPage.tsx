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
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.background.default,
        // Remova minHeight ou height!
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          py: { xs: 4, sm: 6 },
          width: '100%',
          maxWidth: 480,
          borderRadius: 4,
          boxShadow: 8,
          bgcolor: theme.palette.gradients.glass,
          border: `1.5px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontFamily: theme.typography.title.fontFamily,
            fontWeight: 700,
            background: theme.palette.gradients.primary,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            textAlign: 'center',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
            userSelect: 'none',
          }}
        >
          MyIA
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
            maxWidth: 400,
            mb: 2,
            fontSize: { xs: 18, sm: 20 },
            fontWeight: 500,
          }}
        >
          Hub de IA multi-provider com chat persistente, auditoria e analytics.<br />
          Experimente o poder da IA de forma simples e segura.
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
            letterSpacing: '0.03em',
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
    </Box>
  );
};

export default LandingPage;
