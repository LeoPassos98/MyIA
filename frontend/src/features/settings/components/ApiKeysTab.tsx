// frontend/src/features/settings/components/ApiKeysTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { SettingsSection } from './SettingsSection';
import AWSProviderPanel from './providers/AWSProviderPanel';

/**
 * Aba de configuração de chaves de API
 * 
 * Atualmente suporta apenas AWS Bedrock.
 * Outras integrações (OpenAI direto, Azure, etc.) foram removidas
 * pois não estavam funcionais no Clean Slate v2.
 */
export default function ApiKeysTab() {
  return (
    <SettingsSection
      title="AWS Bedrock"
      description="Configure suas credenciais AWS para acessar modelos via Bedrock"
    >
      <AWSProviderPanel />
    </SettingsSection>
  );
}
