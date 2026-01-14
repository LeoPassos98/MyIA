// frontend/src/features/settings/components/providers/AzureProviderPanel.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Typography } from '@mui/material';
import { Construction } from '@mui/icons-material';

export default function AzureProviderPanel() {
  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <Construction sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>Azure OpenAI</Typography>
      <Typography variant="body2" color="text.secondary">
        Configuração em desenvolvimento
      </Typography>
    </Box>
  );
}
