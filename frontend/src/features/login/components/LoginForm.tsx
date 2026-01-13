// frontend/src/features/login/components/LoginForm.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState } from 'react';
import { TextField, Button, Box, Alert, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import GitHubIcon from '@mui/icons-material/GitHub';
import useLogin from '../hooks/useLogin';
import { useAuth } from '../../../contexts/AuthContext';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const theme = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginForm] Submetendo login:', { email, password });
    try {
      await login(email, password);
      console.log('[LoginForm] Login bem-sucedido');
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/chat';
      }
    } catch (err) {
      console.error('[LoginForm] Erro no login:', err);
    }
  };

  const handleGithubLogin = () => {
    // Extrai o callbackUrl da URL atual se existir
    const searchParams = new URLSearchParams(window.location.search);
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    
    // Redireciona para o backend OAuth com o callbackUrl correto
    window.location.href = `http://localhost:3001/api/auth/github?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, gap: 2, display: 'flex', flexDirection: 'column' }}>
      <TextField
        margin="normal"
        required
        fullWidth
        label="E-mail"
        type="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={e => setEmail(e.target.value)}
        sx={{
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
        }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label="Senha"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        sx={{
          bgcolor: theme.palette.background.paper,
          borderRadius: 2,
        }}
      />
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{
          mt: 2,
          mb: 1,
          py: 1.5,
          borderRadius: 2,
          fontWeight: 700,
          fontSize: '1rem',
          background: theme.palette.gradients.primary,
          color: theme.palette.primary.contrastText,
          boxShadow: theme.shadows[2],
          transition: 'all 0.2s',
          '&:hover': {
            background: theme.palette.gradients.secondary,
            transform: 'scale(1.03)',
          },
        }}
        disabled={loading}
      >
        Entrar
      </Button>

      <Divider sx={{ my: 2 }}>ou</Divider>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<GitHubIcon />}
        onClick={handleGithubLogin}
        sx={{
          py: 1.5,
          borderRadius: 2,
          fontWeight: 600,
          borderColor: theme.palette.divider,
          color: theme.palette.text.primary,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: theme.palette.action.hover,
          },
        }}
      >
        Continuar com GitHub
      </Button>
    </Box>
  );
}
