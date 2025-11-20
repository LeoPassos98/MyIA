import { Box, Typography, Badge } from '@mui/material';
import { Link } from 'react-router-dom';
import { AutoAwesome as SparkleIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export default function Logo() {
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
        background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
        border: '1px solid',
        borderColor: alpha('#667eea', 0.1),
        position: 'relative',
        overflow: 'hidden',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        minWidth: 100, // Adicionado para evitar compressão
        flexShrink: 0, // Evita que o logo seja comprimido
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(102,126,234,0.15)',
          borderColor: alpha('#667eea', 0.3),
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(102,126,234,0.1), transparent)',
          animation: 'shimmer 4s infinite',
        },
        '@keyframes shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '200%' },
        },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
        }}
      >
        <SparkleIcon sx={{ color: 'white', fontSize: 20 }} />
      </Box>

      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          fontSize: '1.2rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}
      >
        MyIA
      </Typography>

      <Badge
        badgeContent="TESTE"
        sx={{
          '& .MuiBadge-badge': {
            bgcolor: '#FFD700',
            color: '#000',
            fontWeight: 700,
            fontSize: '0.6rem',
            height: 16,
            minWidth: 28,
            borderRadius: 1,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                transform: 'scale(1)',
                boxShadow: '0 2px 4px rgba(255,215,0,0.3)',
              },
              '50%': {
                transform: 'scale(1.1)',
                boxShadow: '0 3px 8px rgba(255,215,0,0.5)',
              },
            },
          },
        }}
      />
    </Box>
  );
}
