// frontend/src/pages/AuthSuccess.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Token não encontrado');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Salva o token primeiro
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Aguarda um pouco antes de buscar o usuário
    setTimeout(() => {
      api.get('/user/me')
        .then(response => {
          const userData = response.data.user;
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          navigate('/chat');
        })
        .catch(err => {
          console.error('Erro ao autenticar:', err);
          setError('Erro ao autenticar');
          setTimeout(() => navigate('/login'), 2000);
        });
    }, 100);
  }, [searchParams, navigate, setUser]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ animation: 'pulse 1.5s infinite' }}>
              Sincronizando com MyIA...
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};
