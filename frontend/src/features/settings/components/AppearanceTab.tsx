// frontend/src/features/settings/components/AppearanceTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Typography } from '@mui/material';
import { SettingsSection } from './SettingsSection';

export default function AppearanceTab() {
  return (
    <SettingsSection 
      title="Aparência" 
      description="Personalize como o MyIA se parece para você."
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          O modo escuro/claro pode ser alterado no menu lateral.
        </Typography>
      </Box>
    </SettingsSection>
  );
}
