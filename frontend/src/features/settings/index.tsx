// frontend/src/features/settings/index.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Person, Palette, Key } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { userSettingsService, UserSettings } from '../../services/userSettingsService';
import { ObservabilityPageLayout, ObservabilitySection } from '../../components/PageLayout/ObservabilityPageLayout';

import ProfileTab from './components/ProfileTab';
import AppearanceTab from './components/AppearanceTab';
import ApiKeysTab from './components/ApiKeysTab';

export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      userSettingsService.getSettings()
        .then(setUserSettings)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const sections = [
    { id: 'profile', label: 'Perfil', icon: <Person /> },
    { id: 'appearance', label: 'Aparência', icon: <Palette /> },
    { id: 'api-keys', label: 'Chaves de API', icon: <Key /> },
  ];

  return (
    <ObservabilityPageLayout
      sections={sections}
      drawerOpen={drawerOpen}
      onOpenDrawer={() => setDrawerOpen(true)}
      onCloseDrawer={() => setDrawerOpen(false)}
    >
      <ObservabilitySection id="profile" title="Perfil">
        <ProfileTab />
      </ObservabilitySection>

      <ObservabilitySection id="appearance" title="Aparência">
        <AppearanceTab />
      </ObservabilitySection>

      <ObservabilitySection id="api-keys" title="Chaves de API">
        <ApiKeysTab />
      </ObservabilitySection>
    </ObservabilityPageLayout>
  );
}