// frontend/src/components/ProtectedRoute.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // 1. ESTADO DE ESPERA: Se o AuthContext ainda está vendo o localStorage...
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          bgcolor: 'background.default' 
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Verificando credenciais...
        </Typography>
      </Box>
    );
  }

  // 2. VERIFICAÇÃO FINAL: Carregou e não tem user? Tchau.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. SUCESSO: Renderiza a página (PromptTrace, Chat, etc)
  return <Outlet />;
};