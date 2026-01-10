// frontend/src/components/Logo.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Typography, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';



export default function Logo({ brandText = 'MyIA' }: { brandText?: string }) {
  const theme = useTheme();

  return (
    <Box
      component={Link}
      to="/"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 0.5,
        borderRadius: 2,
        background: theme.palette.background.paper,
        border: 'none',
        textDecoration: 'none',
        cursor: 'pointer',
        minWidth: 80,
        flexShrink: 0,
        transition: 'all 0.2s',
        '&:hover': {
          background: theme.palette.action.hover,
          transform: 'scale(1.04)',
        },
        '&:active': {
          transform: 'scale(1)',
        },
      }}
    >
      {/* Ícone minimalista */}
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: theme.palette.primary.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Chat bubble estilizado */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="4" width="12" height="8" rx="4" fill="white" />
          <circle cx="8" cy="8" r="2" fill={theme.palette.primary.main} />
        </svg>
      </Box>

      {/* Texto simples */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: '1.1rem',
          color: theme.palette.text.primary,
          letterSpacing: '-0.5px',
        }}
      >
        {brandText}
      </Typography>
    </Box>
  );
}