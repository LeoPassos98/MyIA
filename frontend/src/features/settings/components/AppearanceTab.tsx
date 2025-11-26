import { Box, Switch, Typography, useTheme as useMuiTheme, alpha } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useTheme } from '../../../contexts/ThemeContext';
import { SettingsSection } from './SettingsSection';

export default function AppearanceTab() {
  const { mode, toggleTheme } = useTheme();
  const theme = useMuiTheme();

  return (
    <SettingsSection 
      title="Aparência" 
      description="Personalize como o MyIA se parece para você."
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {mode === 'dark' ? <DarkMode color="primary" /> : <LightMode color="warning" />}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Modo Escuro
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {mode === 'dark' ? 'Ativado' : 'Desativado'}
            </Typography>
          </Box>
        </Box>

        <Switch
          checked={mode === 'dark'}
          onChange={toggleTheme}
          color="primary"
        />
      </Box>
    </SettingsSection>
  );
}
