// frontend/src/features/register/components/RegisterForm.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState } from 'react';
import { TextField, Button, Box, Alert, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import GitHubIcon from '@mui/icons-material/GitHub';
import useRegister from '../hooks/useRegister';

interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { register, loading, error } = useRegister();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('[RegisterForm] Submetendo registro:', { email, password, name });
    const ok = await register(email, password, name);
    console.log('[RegisterForm] Resultado do registro:', ok);
    if (ok) {
      if (onSuccess) {
        console.log('[RegisterForm] Registro bem-sucedido, chamando onSuccess');
        onSuccess();
      } else {
        console.log('[RegisterForm] Registro bem-sucedido, redirecionando para /chat');
        window.location.href = '/chat';
      }
    }
  };

  const handleGithubLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    window.location.href = `${apiUrl}/api/auth/github`;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, gap: 2, display: 'flex', flexDirection: 'column' }}>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Nome"
        autoComplete="name"
        value={name}
        onChange={e => setName(e.target.value)}
        sx={{ bgcolor: theme.palette.background.paper, borderRadius: 2 }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        sx={{ bgcolor: theme.palette.background.paper, borderRadius: 2 }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label="Senha"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        sx={{ bgcolor: theme.palette.background.paper, borderRadius: 2 }}
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
        Cadastrar
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
