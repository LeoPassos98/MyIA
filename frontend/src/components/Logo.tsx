// frontend/src/components/Logo.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO


import { Box, Typography, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import brandLogoUrl from '../assets/brand/logo.svg';



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
        background: theme.palette.background.default,
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
      {/* Logo SVG importado via <img> para compatibilidade Vite */}
      <Box
        sx={{
          width: 35,
          height: 35,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src={brandLogoUrl} alt="Logo MyIA" width={35} height={35} style={{ display: 'block' }} />
      </Box>

      {/* Texto simples */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: '1.41rem',
          color: theme.palette.text.primary,
          letterSpacing: '0px',
          fontFamily: theme.typography.title,
        }} 
      >
        {brandText}
      </Typography>
    </Box>
  );
}