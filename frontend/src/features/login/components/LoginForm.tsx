// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState } from 'react';
import { TextField, Button, Box, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useLogin from '../hooks/useLogin';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) onSuccess();
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
    </Box>
  );
}
