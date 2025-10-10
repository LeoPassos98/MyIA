import { useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Paper, Typography, Link, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import RegisterForm from '../components/Auth/RegisterForm';

export default function Register() {
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
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            MyIA - Cadastro
          </Typography>
          
          <RegisterForm onSuccess={handleSuccess} />

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Já tem uma conta?{' '}
              <Link component={RouterLink} to="/login" underline="hover">
                Faça login
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}