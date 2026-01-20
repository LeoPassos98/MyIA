// frontend/src/features/settings/index.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, IconButton } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PaletteIcon from '@mui/icons-material/Palette';
import KeyIcon from '@mui/icons-material/Key';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../contexts/AuthContext';
import { userSettingsService, UserSettings } from '../../services/userSettingsService';
import { ObservabilityPageLayout, ObservabilitySection } from '../../components/PageLayout/ObservabilityPageLayout';
import { useHeaderSlots } from '../../contexts/HeaderSlotsContext';

import ProfileTab from './components/ProfileTab';
import AppearanceTab from './components/AppearanceTab';
import ApiKeysTab from './components/ApiKeysTab';

export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const { setSlots, resetSlots } = useHeaderSlots();
  const [, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  // Todos os callbacks antes dos useEffects
  const handleOpenDrawer = useCallback(() => setDrawerOpen(true), []);
  const handleCloseDrawer = useCallback(() => setDrawerOpen(false), []);
  const handleSectionClick = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    setDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      userSettingsService.getSettings()
        .then(setUserSettings)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated]);

  // Adicionar botão de menu no header
  useEffect(() => {
    setSlots({
      left: (
        <IconButton
          onClick={handleOpenDrawer}
          aria-label="Abrir menu de navegação"
          sx={{ display: { xs: 'flex', lg: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
      ),
    });

    return () => resetSlots();
  }, [setSlots, resetSlots, handleOpenDrawer]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const sections = [
    { id: 'profile', label: 'Perfil', icon: <PersonIcon /> },
    { id: 'appearance', label: 'Aparência', icon: <PaletteIcon /> },
    { id: 'api-keys', label: 'Chaves de API', icon: <KeyIcon /> },
  ];

  return (
    <ObservabilityPageLayout
      sections={sections}
      drawerOpen={drawerOpen}
      onOpenDrawer={handleOpenDrawer}
      onCloseDrawer={handleCloseDrawer}
      onSectionClick={handleSectionClick}
    >
      {activeSection === 'profile' && (
        <ObservabilitySection id="profile" title="Perfil">
          <ProfileTab />
        </ObservabilitySection>
      )}

      {activeSection === 'appearance' && (
        <ObservabilitySection id="appearance" title="Aparência">
          <AppearanceTab />
        </ObservabilitySection>
      )}

      {activeSection === 'api-keys' && (
        <ObservabilitySection id="api-keys" title="Chaves de API">
          <ApiKeysTab />
        </ObservabilitySection>
      )}
    </ObservabilityPageLayout>
  );
}