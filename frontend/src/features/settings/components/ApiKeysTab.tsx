// frontend/src/features/settings/components/ApiKeysTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import CloudIcon from '@mui/icons-material/Cloud';
import CodeIcon from '@mui/icons-material/Code';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { SettingsSection } from './SettingsSection';
import StandardProviderPanel from './providers/StandardProviderPanel';
import AWSProviderPanel from './providers/AWSProviderPanel';
import AzureProviderPanel from './providers/AzureProviderPanel';
import ModelsManagementTab from './ModelsManagementTab';

export default function ApiKeysTab() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SettingsSection
      title="Chaves de API"
      description="Configure suas credenciais para cada provedor de IA"
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<KeyIcon />} label="Padrão" iconPosition="start" />
          <Tab icon={<CloudIcon />} label="AWS Bedrock" iconPosition="start" />
          <Tab icon={<CodeIcon />} label="Azure OpenAI" iconPosition="start" />
          <Tab icon={<SmartToyIcon />} label="Gerenciar Modelos" iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && <StandardProviderPanel />}
      {activeTab === 1 && <AWSProviderPanel />}
      {activeTab === 2 && <AzureProviderPanel />}
      {activeTab === 3 && <ModelsManagementTab />}
    </SettingsSection>
  );
}
