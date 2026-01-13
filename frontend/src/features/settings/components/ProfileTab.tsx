// frontend/src/features/settings/components/ProfileTab.tsx

import { 
  Box, TextField, Button, Grid, Alert, 
  Card, CardContent, Avatar, Typography, Divider, Chip 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import GitHubIcon from '@mui/icons-material/GitHub'; // Se não tiver, use um ícone de pessoa
import { SettingsSection } from './SettingsSection';
import { useProfileTab } from '../hooks/useProfileTab';

export default function ProfileTab() {
  const theme = useTheme();
  const {
    user,
    name,
    setName,
    isSavingName,
    nameMsg,
    handleSaveName,
    passwords,
    setPasswords,
    isChangingPass,
    passMsg,
    handleChangePassword,
  } = useProfileTab();

  const inputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* 💳 CARD DE IDENTIDADE DO USUÁRIO */}
      <Card sx={{ 
        background: theme.palette.background.paper, 
        borderRadius: 3, 
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 3
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                fontSize: '2rem',
                background: theme.palette.gradients?.primary || theme.palette.primary.main,
                boxShadow: 4
              }}
            >
              {user?.name?.charAt(0) || user?.email?.charAt(0)}
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {user?.name || 'Usuário MyIA'}
                </Typography>
                {/* Tag indicando que veio do GitHub */}
                <Chip 
                  icon={<GitHubIcon style={{ fontSize: 16 }} />} 
                  label="GitHub" 
                  size="small" 
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                />
              </Box>
              <Typography variant="body1" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                Conta verificada via Social Login
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Divider />

      {/* Seção Dados Pessoais */}
      <SettingsSection title="Dados Pessoais">
        {nameMsg && <Alert severity={nameMsg.type} sx={{ mb: 2 }}>{nameMsg.text}</Alert>}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Email" value={user?.email || ''} disabled sx={inputStyle} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth label="Nome de Exibição" value={name} 
              onChange={(e) => setName(e.target.value)} sx={inputStyle} 
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={handleSaveName}
              disabled={isSavingName}
              sx={{ 
                background: theme.palette.gradients?.primary || theme.palette.primary.main, 
                fontWeight: 'bold',
                px: 4,
                borderRadius: 2
              }}
            >
              {isSavingName ? 'Salvando...' : 'Atualizar Nome'}
            </Button>
          </Grid>
        </Grid>
      </SettingsSection>

      {/* Seção Segurança */}
      <SettingsSection title="Segurança">
        {passMsg && <Alert severity={passMsg.type} sx={{ mb: 2 }}>{passMsg.text}</Alert>}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth type="password" label="Senha Atual" 
              value={passwords.current}
              onChange={(e) => setPasswords({...passwords, current: e.target.value})}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth type="password" label="Nova Senha" 
              value={passwords.new}
              onChange={(e) => setPasswords({...passwords, new: e.target.value})}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              fullWidth type="password" label="Confirmar Nova Senha" 
              value={passwords.confirm}
              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="warning"
              onClick={handleChangePassword}
              disabled={isChangingPass}
              sx={{ fontWeight: 'bold', borderRadius: 2 }}
            >
              Alterar Senha
            </Button>
          </Grid>
        </Grid>
      </SettingsSection>
    </Box>
  );
}