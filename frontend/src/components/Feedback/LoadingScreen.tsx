// frontend/src/components/Feedback/LoadingScreen.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Box, Typography, CircularProgress, Fade, alpha, useTheme } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
  visible: boolean;
}

export function LoadingScreen({ message = "Iniciando conexão...", visible }: LoadingScreenProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        flexDirection: 'column'
      }}
    >
      <Fade in timeout={500}>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 3,
              bgcolor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
              position: 'relative'
            }}
          >
            {/* Efeito de pulso simples */}
            <CircularProgress 
              size={50} 
              sx={{ 
                color: 'common.white',
                position: 'absolute'
              }} 
            />
          </Box>
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            {message}
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
