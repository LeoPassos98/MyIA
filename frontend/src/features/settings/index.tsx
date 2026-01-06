import { useState, useEffect, SyntheticEvent } from 'react';
import { Box, Container, Tabs, Tab, Typography, CircularProgress, useTheme } from '@mui/material';
import MainLayout from '../../components/Layout/MainLayout';
import MainContentWrapper from '../../components/Layout/MainContentWrapper'; // <--- Importe o Wrapper
import { useAuth } from '../../contexts/AuthContext';
import { userSettingsService, UserSettings } from '../../services/userSettingsService';
import { scrollbarStyles } from '../../theme/scrollbarStyles';

// Componentes Modulares
import ProfileTab from './components/ProfileTab';
import AppearanceTab from './components/AppearanceTab';
import ApiKeysTab from './components/ApiKeysTab';
import AnalyticsTab from './components/AnalyticsTab';

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
      <MainLayout>
        <MainContentWrapper>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        </MainContentWrapper>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <MainContentWrapper>
        <Box 
          sx={{ 
            flex: 1,           
            overflowY: 'auto', 
            height: '100%',    
            pb: 4,
            pt: '80px', // <--- ADICIONADO (64px do Header + respiro extra)
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
                <Tab label="Analytics" />
              </Tabs>
            </Box>

            <Box sx={{ minHeight: 400 }}>
              {tabIndex === 0 && <ProfileTab />}
              {tabIndex === 1 && <AppearanceTab />}
              {tabIndex === 2 && <ApiKeysTab userSettings={userSettings} onUpdate={setUserSettings} />}
              {tabIndex === 3 && <AnalyticsTab />}
            </Box>
          </Container>
        </Box>
      </MainContentWrapper>
    </MainLayout>
  );
}