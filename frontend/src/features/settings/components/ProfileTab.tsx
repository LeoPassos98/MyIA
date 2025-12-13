import { useState, useEffect } from 'react';
import { Box, TextField, Button, Grid, Alert } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { userService } from '../../../services/userService';
import { authService } from '../../../services/authService';
import { SettingsSection } from './SettingsSection';
import { useTheme } from '@mui/material/styles';

export default function ProfileTab() {
  const theme = useTheme();
  const { user, setUser } = useAuth();
  
  // States para Nome
  const [name, setName] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // States para Senha
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => { if (user?.name) setName(user.name); }, [user]);

  const handleSaveName = async () => {
    try {
      setIsSavingName(true);
      await userService.updateProfile({ name });
      if (setUser && user) setUser({ ...user, name });
      setNameMsg({ type: 'success', text: 'Nome atualizado!' });
    } catch (error) {
      setNameMsg({ type: 'error', text: 'Erro ao atualizar nome.' });
    } finally {
      setIsSavingName(false);
      setTimeout(() => setNameMsg(null), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setPassMsg({ type: 'error', text: 'Senhas não conferem.' });
      return;
    }
    try {
      setIsChangingPass(true);
      await authService.changePassword({ oldPassword: passwords.current, newPassword: passwords.new });
      setPasswords({ current: '', new: '', confirm: '' });
      setPassMsg({ type: 'success', text: 'Senha alterada!' });
    } catch (error) {
      setPassMsg({ type: 'error', text: 'Erro ao alterar senha.' });
    } finally {
      setIsChangingPass(false);
      setTimeout(() => setPassMsg(null), 3000);
    }
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Seção Dados Pessoais */}
      <SettingsSection title="Dados Pessoais">
        {nameMsg && <Alert severity={nameMsg.type} sx={{ mb: 2 }}>{nameMsg.text}</Alert>}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Email" value={user?.email} disabled sx={inputStyle} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth label="Nome" value={name} 
              onChange={(e) => setName(e.target.value)} sx={inputStyle} 
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={handleSaveName}
              disabled={isSavingName}
              sx={{ background: theme.palette.gradients.primary, fontWeight: 'bold' }}
            >
              {isSavingName ? 'Salvando...' : 'Salvar Nome'}
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
              fullWidth type="password" label="Confirmar" 
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
              sx={{ fontWeight: 'bold' }}
            >
              Alterar Senha
            </Button>
          </Grid>
        </Grid>
      </SettingsSection>
    </Box>
  );
}
