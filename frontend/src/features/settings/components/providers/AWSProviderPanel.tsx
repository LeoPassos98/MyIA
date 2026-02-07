// frontend/src/features/settings/components/providers/AWSProviderPanel.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useCallback } from 'react';
import { Box, CircularProgress, Divider, Typography } from '@mui/material';
import { useAWSConfig } from '@/features/settings/hooks/useAWSConfig';
import { EnrichedAWSModel } from '@/types/ai';
import { ModelInfoDrawer } from '@/components/ModelInfoDrawer';
import { useCertificationCache } from '@/hooks/useCertificationCache';
import { AWSCredentialsSection } from './aws/sections/AWSCredentialsSection';
import { AWSModelsSection } from './aws/sections/AWSModelsSection';

/**
 * Painel de configuração do AWS Provider
 * 
 * Componente orquestrador que coordena:
 * - Seção de credenciais AWS (Access Key, Secret Key, Região)
 * - Seção de modelos (Seleção, busca, certificação)
 * - Drawer de informações de modelo
 * 
 * Arquitetura:
 * - Componente principal mantém apenas coordenação
 * - Lógica complexa extraída para hooks customizados
 * - UI dividida em seções especializadas
 * 
 * Conformidade: STANDARDS.md §15 (≤250 linhas)
 */
export default function AWSProviderPanel() {
  // ✅ Hook principal de configuração AWS
  const {
    formState,
    isLoading,
    isSaving,
    error,
    success,
    validationStatus,
    validationResult,
    availableModels,
    selectedModels,
    handleFieldChange,
    handleValidate,
    handleSave,
    toggleModel,
  } = useAWSConfig();
  
  // ✅ Cache global de certificações
  const { certifiedModels, unavailableModels, qualityWarningModels, refresh: refreshCertifications } = useCertificationCache();
  
  // ✅ Estados para o drawer de informações do modelo
  const [selectedModelForInfo, setSelectedModelForInfo] = useState<EnrichedAWSModel | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // ✅ Handler otimizado para abrir drawer de informações
  const handleShowModelInfo = useCallback((model: EnrichedAWSModel) => {
    setSelectedModelForInfo(model);
    setIsDrawerOpen(true);
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }
  
  // Determinar se pode selecionar modelos
  const canSelectModels = validationStatus === 'valid';

  return (
    <>
      <Box component="form" onSubmit={e => e.preventDefault()}>
        {/* Seção 1: Credenciais AWS */}
        <Typography variant="h6" gutterBottom>Credenciais AWS</Typography>
        <AWSCredentialsSection
          formState={formState}
          validationStatus={validationStatus}
          validationResult={validationResult}
          error={error}
          success={success}
          isSaving={isSaving}
          handleFieldChange={handleFieldChange}
          handleValidate={handleValidate}
          handleSave={handleSave}
        />

        <Divider sx={{ my: 3 }} />

        {/* Seção 2: Modelos AWS */}
        <AWSModelsSection
          availableModels={availableModels}
          selectedModels={selectedModels}
          toggleModel={toggleModel}
          canSelectModels={canSelectModels}
          isSaving={isSaving}
          handleSave={handleSave}
          unavailableModels={unavailableModels}
          refreshCertifications={refreshCertifications}
          onShowModelInfo={handleShowModelInfo}
        />
      </Box>

      {/* ✅ Drawer profissional para informações do modelo */}
      <ModelInfoDrawer
        open={isDrawerOpen}
        model={selectedModelForInfo}
        onClose={() => setIsDrawerOpen(false)}
        isCertified={selectedModelForInfo ? certifiedModels.includes(selectedModelForInfo.apiModelId) : false}
        hasQualityWarning={selectedModelForInfo ? qualityWarningModels.includes(selectedModelForInfo.apiModelId) : false}
        isUnavailable={selectedModelForInfo ? unavailableModels.includes(selectedModelForInfo.apiModelId) : false}
      />
    </>
  );
}
