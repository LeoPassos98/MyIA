// frontend/src/features/login/LoginPage.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Paper, Typography, Link, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import MainHeader from '../../components/Layout/MainHeader';
import LoginForm from './components/LoginForm';

export default function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  const handleSuccess = () => {
    navigate('/chat');
  };
  
  return (
    <>
      <MainHeader />
      <Container component="main" maxWidth="xs" sx={{ px: 0 }}>
        <Box
          sx={{
            marginTop: 10, // espaço extra por causa do header fixo
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: 3,
              background:
                theme.palette.mode === 'dark'
                  ? theme.palette.background.paper
                  : theme.palette.gradients.glass,
              boxShadow: theme.shadows[3],
            }}
          >
            <Typography
              component="h1"
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                color: theme.palette.primary.main,
                mb: 2,
              }}
            >
              MyIA - Login
            </Typography>
            <LoginForm onSuccess={handleSuccess} />
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Não tem uma conta?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  underline="hover"
                  sx={{
                    color: theme.palette.secondary.main,
                    fontWeight: 700,
                  }}
                >
                  Cadastre-se
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
}
