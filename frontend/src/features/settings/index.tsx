// frontend/src/features/settings/index.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect, SyntheticEvent } from 'react';
import { Box, Container, Tabs, Tab, Typography, CircularProgress, useTheme } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { userSettingsService, UserSettings } from '../../services/userSettingsService';
import { scrollbarStyles } from '../../theme/scrollbarStyles';

// Componentes Modulares
import ProfileTab from './components/ProfileTab';
import AppearanceTab from './components/AppearanceTab';
import ApiKeysTab from './components/ApiKeysTab';

export default function SettingsPage() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      userSettingsService.getSettings()
        .then(setUserSettings)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated]);

  const handleTabChange = (_: SyntheticEvent, newValue: number) => setTabIndex(newValue);

  // Loading State centralizado
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>);
  }

  return (
    <Box
      sx={{
        flex: 1,
        pb: 4,
        ...scrollbarStyles,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4, background: theme.palette.gradients.primary, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Configurações
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            variant="scrollable"
            sx={{
              '& .MuiTab-root': { fontWeight: 600, fontSize: '1rem' },
              '& .Mui-selected': { color: 'primary.main' }
            }}
          >
            <Tab label="Perfil" />
            <Tab label="Aparência" />
            <Tab label="Chaves de API" />
          </Tabs>
        </Box>

        <Box sx={{ minHeight: 400 }}>
          {tabIndex === 0 && <ProfileTab />}
          {tabIndex === 1 && <AppearanceTab />}
          {tabIndex === 2 && <ApiKeysTab />}
        </Box>
      </Container>
    </Box>);
}