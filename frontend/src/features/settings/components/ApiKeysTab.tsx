// frontend/src/features/settings/components/ApiKeysTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { Key, Cloud, Code } from '@mui/icons-material';
import { SettingsSection } from './SettingsSection';
import StandardProviderPanel from './providers/StandardProviderPanel';
import AWSProviderPanel from './providers/AWSProviderPanel';
import AzureProviderPanel from './providers/AzureProviderPanel';

export default function ApiKeysTab() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SettingsSection 
      title="Chaves de API" 
      description="Configure suas credenciais para cada provedor de IA"
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<Key />} label="Padrão" iconPosition="start" />
          <Tab icon={<Cloud />} label="AWS Bedrock" iconPosition="start" />
          <Tab icon={<Code />} label="Azure OpenAI" iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && <StandardProviderPanel />}
      {activeTab === 1 && <AWSProviderPanel />}
      {activeTab === 2 && <AzureProviderPanel />}
    </SettingsSection>
  );
}
