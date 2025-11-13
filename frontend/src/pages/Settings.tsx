import { Box, Typography, Container, Paper } from '@mui/material';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Proteger a rota (igual à página de Chat)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Painel de Controle
          </Typography>
          <Typography variant="body1">
            Em breve: configurações de perfil, aparência (modo escuro) e chaves de API.
          </Typography>
        </Paper>
      </Container>
    </MainLayout>
  );
}
