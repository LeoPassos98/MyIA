import { Box, Typography, Badge, useTheme, alpha } from '@mui/material';
import { Link } from 'react-router-dom';
import { AutoAwesome as SparkleIcon } from '@mui/icons-material';

export default function Logo() {
  const theme = useTheme();

  return (
    <Box
      component={Link}
      to="/"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 3,
        py: 0.75,
        borderRadius: 10,
        
        // --- PERFORMANCE OPTIMIZATION ---
        // Removemos o gradiente animado e usamos uma cor sólida com transparência.
        // Isso evita "repaints" constantes na GPU.
        background: alpha(theme.palette.primary.main, 0.04),
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.1),
        
        position: 'relative',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        minWidth: 100,
        flexShrink: 0,
        
        // Hover simples (sem animação de loop)
        '&:hover': {
          background: alpha(theme.palette.primary.main, 0.08),
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
          borderColor: alpha(theme.palette.primary.main, 0.3),
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      }}
    >
      {/* Ícone (Estático) */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          background: theme.palette.gradients.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
        }}
      >
        <SparkleIcon sx={{ color: 'white', fontSize: 18 }} />
      </Box>

      {/* Texto (Estático) */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          fontSize: '1.2rem',
          background: theme.palette.gradients.primary,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}
      >
        MyIA
      </Typography>

      {/* Badge "TESTE" (Único elemento animado) */}
      <Badge
        badgeContent="TESTE"
        sx={{
          '& .MuiBadge-badge': {
            bgcolor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
            fontWeight: 700,
            fontSize: '0.6rem',
            height: 16,
            minWidth: 28,
            borderRadius: 1,
            
            // Animação de pulso mantida aqui (leve pois o elemento é pequeno)
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.warning.main, 0.4)}` },
              '70%': { boxShadow: `0 0 0 4px ${alpha(theme.palette.warning.main, 0)}` },
              '100%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.warning.main, 0)}` },
            },
          }
        }}
      />
    </Box>
  );
}