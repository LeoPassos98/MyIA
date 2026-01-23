// frontend/src/features/chat/components/ControlPanel/ProviderBadge.example.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Exemplos de uso do componente ProviderBadge
 * 
 * Este arquivo serve como documentação viva e pode ser usado para testes visuais.
 */

import { Box, Typography } from '@mui/material';
import { ProviderBadge, ProviderBadgeGroup } from './ProviderBadge';
import type { ProviderAvailability } from '../../../../types/ai';

/**
 * Exemplo 1: Provider configurado com certificação
 */
const awsConfigured: ProviderAvailability = {
  providerSlug: 'aws',
  providerName: 'AWS Bedrock',
  isConfigured: true,
  certification: {
    status: 'certified',
    successRate: 98,
    lastChecked: new Date().toISOString()
  }
};

/**
 * Exemplo 2: Provider não configurado
 */
const azureNotConfigured: ProviderAvailability = {
  providerSlug: 'azure',
  providerName: 'Azure',
  isConfigured: false,
  certification: null
};

/**
 * Exemplo 3: Provider com warning de qualidade
 */
const openaiWarning: ProviderAvailability = {
  providerSlug: 'openai',
  providerName: 'OpenAI',
  isConfigured: true,
  certification: {
    status: 'quality_warning',
    successRate: 75,
    lastChecked: new Date().toISOString()
  }
};

/**
 * Componente de exemplo para visualização
 */
export function ProviderBadgeExamples() {
  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Badge Individual - Configurado
        </Typography>
        <ProviderBadge provider={awsConfigured} showCertification />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Badge Individual - Não Configurado
        </Typography>
        <ProviderBadge provider={azureNotConfigured} />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Badge Individual - Com Warning
        </Typography>
        <ProviderBadge provider={openaiWarning} showCertification />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Grupo de Badges
        </Typography>
        <ProviderBadgeGroup
          providers={[awsConfigured, azureNotConfigured, openaiWarning]}
          showCertification
        />
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Grupo de Badges - Tamanho Medium
        </Typography>
        <ProviderBadgeGroup
          providers={[awsConfigured, azureNotConfigured]}
          size="medium"
          showCertification
        />
      </Box>
    </Box>
  );
}

/**
 * Exemplo de uso em um contexto real (ModelCard)
 */
export function ModelCardExample() {
  const modelProviders: ProviderAvailability[] = [
    awsConfigured,
    azureNotConfigured,
    openaiWarning
  ];

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Claude 3.5 Sonnet
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Disponível em:
      </Typography>
      
      <ProviderBadgeGroup
        providers={modelProviders}
        showCertification
      />
    </Box>
  );
}
